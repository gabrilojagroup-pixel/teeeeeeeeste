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

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Get user profile to fetch CPF
    const { data: profile } = await serviceRoleClient
      .from('profiles')
      .select('cpf, full_name, phone')
      .eq('user_id', userId)
      .single()

    // Use provided document, profile CPF, or require CPF
    let userDocument = document || profile?.cpf
    
    // Clean and validate CPF format
    if (userDocument) {
      userDocument = userDocument.replace(/\D/g, '')
      if (userDocument.length === 11) {
        // Format as CPF
        userDocument = `${userDocument.slice(0, 3)}.${userDocument.slice(3, 6)}.${userDocument.slice(6, 9)}-${userDocument.slice(9)}`
      }
    }

    if (!userDocument || userDocument.replace(/\D/g, '').length !== 11) {
      return new Response(
        JSON.stringify({ error: 'CPF é obrigatório para realizar depósitos. Por favor, cadastre seu CPF na aba de saques primeiro.', requiresCpf: true }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Generate unique identifier
    const identifier = `dep_${userId}_${Date.now()}`

    // Format phone number
    let formattedPhone = phone || profile?.phone || '(11) 99999-9999'
    if (!formattedPhone.includes('(')) {
      const cleanPhone = formattedPhone.replace(/\D/g, '')
      if (cleanPhone.length >= 10) {
        formattedPhone = `(${cleanPhone.slice(0, 2)}) ${cleanPhone.slice(2, 7)}-${cleanPhone.slice(7)}`
      }
    }

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
          name: name || profile?.full_name || 'Cliente',
          email: email || 'cliente@email.com',
          phone: formattedPhone,
          document: userDocument,
        },
        callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/poseidonpay-webhook`,
      }),
    })

    const poseidonData = await poseidonResponse.json()

    if (!poseidonResponse.ok || poseidonData.status === 'FAILED') {
      console.error('PoseidonPay error:', poseidonData)
      return new Response(
        JSON.stringify({ error: poseidonData.message || poseidonData.errorDescription || 'Erro ao criar PIX' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

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
