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
    const { amount, name, email, phone, document } = await req.json()

    if (!amount || amount < 30) {
      return new Response(
        JSON.stringify({ error: 'Valor mínimo de depósito: R$ 30,00' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique identifier
    const identifier = `dep_${userId}_${Date.now()}`

    // Create PIX via PoseidonPay API
    const poseidonResponse = await fetch('https://app.poseidonpay.site/api/v1/gateway/pix/receive', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': Deno.env.get('POSEIDONPAY_PUBLIC_KEY')!,
        'x-secret-key': Deno.env.get('POSEIDONPAY_SECRET_KEY')!,
      },
      body: JSON.stringify({
        identifier,
        amount,
        client: {
          name: name || 'Cliente',
          email: email || 'cliente@email.com',
          phone: phone || '(11) 99999-9999',
          document: document || '000.000.000-00',
        },
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/poseidonpay-webhook`,
      }),
    })

    const poseidonData = await poseidonResponse.json()

    if (!poseidonResponse.ok || poseidonData.status === 'FAILED') {
      console.error('PoseidonPay error:', poseidonData)
      return new Response(
        JSON.stringify({ error: poseidonData.errorDescription || 'Erro ao criar PIX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Create transaction record
    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    const { error: txError } = await serviceRoleClient.from('transactions').insert({
      user_id: userId,
      type: 'deposit',
      amount,
      status: 'pending',
      description: `PIX Deposit - ${poseidonData.transactionId}`,
    })

    if (txError) {
      console.error('Transaction insert error:', txError)
      return new Response(
        JSON.stringify({ error: 'Erro ao registrar depósito' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({
        success: true,
        transactionId: poseidonData.transactionId,
        pix: poseidonData.pix,
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
