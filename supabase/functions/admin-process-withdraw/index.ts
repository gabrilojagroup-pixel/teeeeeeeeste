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

    const serviceRoleClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Verify admin role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return new Response(
        JSON.stringify({ error: 'Unauthorized' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if user is admin
    const { data: adminRole } = await serviceRoleClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle()

    if (!adminRole) {
      return new Response(
        JSON.stringify({ error: 'Acesso negado - apenas administradores' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const { transactionId, action } = await req.json()

    if (!transactionId || !action) {
      return new Response(
        JSON.stringify({ error: 'Transaction ID e ação são obrigatórios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get transaction
    const { data: transaction, error: txError } = await serviceRoleClient
      .from('transactions')
      .select('*')
      .eq('id', transactionId)
      .single()

    if (txError || !transaction) {
      return new Response(
        JSON.stringify({ error: 'Transação não encontrada' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (transaction.status !== 'pending') {
      return new Response(
        JSON.stringify({ error: 'Transação já foi processada' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get user profile
    const { data: profile } = await serviceRoleClient
      .from('profiles')
      .select('*')
      .eq('user_id', transaction.user_id)
      .single()

    if (action === 'reject') {
      // Reject: return balance to user
      if (profile) {
        await serviceRoleClient
          .from('profiles')
          .update({ balance: Number(profile.balance) + Number(transaction.amount) })
          .eq('id', profile.id)
      }

      await serviceRoleClient
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', transactionId)

      // Notify user
      await serviceRoleClient.from('notifications').insert({
        user_id: transaction.user_id,
        title: 'Saque rejeitado',
        message: `Seu saque de R$ ${Number(transaction.amount).toFixed(2)} foi rejeitado. O saldo foi devolvido à sua conta.`,
        type: 'error',
      })

      return new Response(
        JSON.stringify({ success: true, message: 'Saque rejeitado e saldo devolvido' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    if (action === 'approve') {
      // Calculate fee and net amount
      const amount = Number(transaction.amount)
      const feeAmount = amount * 0.10
      const amountAfterFee = amount - feeAmount

      const pixKey = transaction.pix_key
      const pixType = detectPixType(pixKey)
      const identifier = `wit_${transaction.id}_${Date.now()}`

      console.log(`Processing withdraw: amount=${amount}, fee=${feeAmount}, net=${amountAfterFee}, pix=${pixKey}`)

      // Call PoseidonPay API
      const poseidonResponse = await fetch('https://app.poseidonpay.site/api/v1/gateway/transfers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-public-key': Deno.env.get('POSEIDONPAY_PUBLIC_KEY')!,
          'x-secret-key': Deno.env.get('POSEIDONPAY_SECRET_KEY')!,
        },
        body: JSON.stringify({
          identifier,
          amount: amountAfterFee,
          discountFeeOfReceiver: true,
          pix: {
            type: pixType,
            key: pixKey,
          },
          owner: {
            ip: '127.0.0.1',
            name: profile?.full_name || 'Cliente',
            document: {
              type: 'cpf',
              number: profile?.cpf || '000.000.000-00',
            },
          },
          callbackUrl: `${Deno.env.get('SUPABASE_URL')}/functions/v1/poseidonpay-webhook`,
        }),
      })

      const poseidonData = await poseidonResponse.json()

      if (!poseidonResponse.ok || poseidonData.withdraw?.status === 'CANCELED') {
        console.error('PoseidonPay error:', poseidonData)
        return new Response(
          JSON.stringify({ 
            error: poseidonData.message || poseidonData.withdraw?.rejectedReason || 'Erro ao processar transferência PIX',
            details: poseidonData
          }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      // Update transaction status
      await serviceRoleClient
        .from('transactions')
        .update({ 
          status: 'approved',
          description: `PIX enviado - ID: ${poseidonData.withdraw?.id || identifier}`
        })
        .eq('id', transactionId)

      // Notify user
      await serviceRoleClient.from('notifications').insert({
        user_id: transaction.user_id,
        title: 'Saque aprovado!',
        message: `Seu saque de R$ ${amount.toFixed(2)} foi aprovado! Valor líquido de R$ ${amountAfterFee.toFixed(2)} enviado para sua chave PIX.`,
        type: 'success',
      })

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Saque aprovado e PIX enviado!',
          withdrawId: poseidonData.withdraw?.id,
          status: poseidonData.withdraw?.status
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ error: 'Ação inválida' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: 'Erro interno do servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
