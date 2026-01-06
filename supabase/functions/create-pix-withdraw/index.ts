import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: claims, error: claimsError } = await supabase.auth.getClaims(
      authHeader.replace('Bearer ', '')
    )
    
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const userId = claims.claims.sub
    const { amount, pixKey, name, document } = await req.json()

    if (!amount || amount < 30) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo de saque: R$ 30,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (!pixKey) {
      return new Response(
        JSON.stringify({ error: 'Chave PIX é obrigatória' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user profile and check balance
    const { data: profile, error: profileError } = await serviceRoleClient
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single()

    if (profileError || !profile) {
      return new Response(
        JSON.stringify({ error: 'Perfil não encontrado' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (profile.balance < amount) {
      return new Response(
        JSON.stringify({ error: 'Saldo insuficiente' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Apply 10% fee
    const FEE_PERCENTAGE = 0.10
    const feeAmount = amount * FEE_PERCENTAGE
    const amountAfterFee = amount - feeAmount

    console.log(`Withdraw request: amount=${amount}, fee=${feeAmount}, amountAfterFee=${amountAfterFee}`)

    // Deduct full amount from balance (including fee)
    await serviceRoleClient
      .from('profiles')
      .update({ balance: profile.balance - amount })
      .eq('id', profile.id)

    // Create transaction record as pending (admin will approve/reject)
    const { data: transaction, error: transactionError } = await serviceRoleClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'withdrawal',
        amount,
        status: 'pending',
        pix_key: pixKey,
        description: `Saque PIX - Valor líquido: R$ ${amountAfterFee.toFixed(2)} (Taxa: R$ ${feeAmount.toFixed(2)})`,
      })
      .select()
      .single()

    if (transactionError) {
      console.error('Transaction error:', transactionError)
      // Restore balance if transaction failed
      await serviceRoleClient
        .from('profiles')
        .update({ balance: profile.balance })
        .eq('id', profile.id)
      
      return new Response(
        JSON.stringify({ error: 'Erro ao criar solicitação de saque' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Solicitação de saque enviada! Aguarde aprovação.',
        withdrawId: transaction.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
