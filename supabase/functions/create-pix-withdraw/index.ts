import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

function detectPixType(pixKey: string): 'cpf' | 'cnpj' | 'phone' | 'email' | 'random' {
  const cleanKey = pixKey.replace(/[^\w@.+-]/g, '')
  
  if (cleanKey.includes('@')) return 'email'
  if (/^\d{11}$/.test(cleanKey.replace(/\D/g, ''))) {
    if (cleanKey.includes('(') || cleanKey.includes('+')) return 'phone'
    return 'cpf'
  }
  if (/^\d{14}$/.test(cleanKey.replace(/\D/g, ''))) return 'cnpj'
  if (/^\+?\d{10,13}$/.test(cleanKey.replace(/\D/g, ''))) return 'phone'
  return 'random'
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

    // Generate unique identifier
    const identifier = `wit_${userId}_${Date.now()}`
    const pixType = detectPixType(pixKey)

    // Get user IP from request
    const userIp = req.headers.get('x-forwarded-for')?.split(',')[0] || '127.0.0.1'

    console.log(`Withdraw: amount=${amount}, fee=${feeAmount}, amountAfterFee=${amountAfterFee}`)

    // Create transfer via PoseidonPay API (send amount after fee)
    const poseidonResponse = await fetch('https://app.poseidonpay.site/api/v1/gateway/transfers', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-public-key': Deno.env.get('POSEIDONPAY_PUBLIC_KEY')!,
        'x-secret-key': Deno.env.get('POSEIDONPAY_SECRET_KEY')!,
      },
      body: JSON.stringify({
        identifier,
        amount: amountAfterFee, // Send amount after 10% fee deduction
        discountFeeOfReceiver: true,
        pix: {
          type: pixType,
          key: pixKey,
        },
        owner: {
          ip: userIp,
          name: name || profile.full_name || 'Cliente',
          document: {
            type: 'cpf',
            number: document || '000.000.000-00',
          },
        },
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/poseidonpay-webhook`,
      }),
    })

    const poseidonData = await poseidonResponse.json()

    if (!poseidonResponse.ok || poseidonData.withdraw?.status === 'CANCELED') {
      console.error('PoseidonPay error:', poseidonData)
      return new Response(
        JSON.stringify({ error: poseidonData.withdraw?.rejectedReason || 'Erro ao criar transferência' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Deduct full amount from balance (including fee)
    await serviceRoleClient
      .from('profiles')
      .update({ balance: profile.balance - amount })
      .eq('id', profile.id)

    // Create transaction record with full amount
    await serviceRoleClient.from('transactions').insert({
      user_id: userId,
      type: 'withdrawal',
      amount, // Record full amount (including fee)
      status: 'pending',
      pix_key: pixKey,
      description: `PIX Withdraw - ${poseidonData.withdraw?.id} (Taxa: R$ ${feeAmount.toFixed(2)})`,
    })

    return new Response(
      JSON.stringify({
        success: true,
        withdrawId: poseidonData.withdraw?.id,
        status: poseidonData.withdraw?.status,
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
