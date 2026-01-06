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
    const payload = await req.json()
    console.log('Webhook received:', JSON.stringify(payload))

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    )

    // Handle deposit (transaction) webhook
    if (payload.transactionId || payload.id) {
      const transactionId = payload.transactionId || payload.id
      const status = payload.status

      // Find the transaction by description containing the transaction ID
      const { data: transactions, error: findError } = await supabase
        .from('transactions')
        .select('*')
        .like('description', `%${transactionId}%`)

      if (findError || !transactions || transactions.length === 0) {
        console.log('Transaction not found for:', transactionId)
        return new Response(
          JSON.stringify({ received: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }

      const transaction = transactions[0]

      // Map PoseidonPay status to our status
      let newStatus = 'pending'
      if (status === 'COMPLETED') {
        newStatus = 'approved'
      } else if (status === 'FAILED' || status === 'REFUNDED' || status === 'CHARGED_BACK') {
        newStatus = 'rejected'
      }

      // Update transaction status
      await supabase
        .from('transactions')
        .update({ status: newStatus })
        .eq('id', transaction.id)

      // If deposit was approved, credit user balance
      if (transaction.type === 'deposit' && newStatus === 'approved') {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('user_id', transaction.user_id)
          .single()

        if (profile) {
          await supabase
            .from('profiles')
            .update({ balance: (profile.balance || 0) + transaction.amount })
            .eq('id', profile.id)

          // Create notification
          await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            title: '💰 Depósito Aprovado!',
            message: `Seu depósito de R$ ${transaction.amount.toFixed(2)} foi confirmado e creditado em sua conta.`,
            type: 'success',
          })
        }
      } else if (transaction.type === 'deposit' && newStatus === 'rejected') {
        await supabase.from('notifications').insert({
          user_id: transaction.user_id,
          title: '❌ Depósito Rejeitado',
          message: `Seu depósito de R$ ${transaction.amount.toFixed(2)} não foi processado. Entre em contato com o suporte.`,
          type: 'error',
        })
      }

      // Handle withdrawal status updates
      if (transaction.type === 'withdrawal') {
        if (newStatus === 'approved') {
          await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            title: '✅ Saque Aprovado!',
            message: `Seu saque de R$ ${transaction.amount.toFixed(2)} foi processado e enviado para sua chave PIX.`,
            type: 'success',
          })
        } else if (newStatus === 'rejected') {
          // Return balance on rejected withdrawal
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', transaction.user_id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({ balance: (profile.balance || 0) + transaction.amount })
              .eq('id', profile.id)
          }

          await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            title: '❌ Saque Rejeitado',
            message: `Seu saque de R$ ${transaction.amount.toFixed(2)} foi rejeitado. O valor foi devolvido ao seu saldo.`,
            type: 'error',
          })
        }
      }
    }

    // Handle transfer (withdraw) webhook
    if (payload.withdraw) {
      const withdrawId = payload.withdraw.id
      const status = payload.withdraw.status

      const { data: transactions } = await supabase
        .from('transactions')
        .select('*')
        .like('description', `%${withdrawId}%`)

      if (transactions && transactions.length > 0) {
        const transaction = transactions[0]

        let newStatus = 'pending'
        if (status === 'COMPLETED') {
          newStatus = 'approved'
        } else if (status === 'CANCELED' || status === 'FAILED') {
          newStatus = 'rejected'
        } else if (status === 'PROCESSING' || status === 'TRANSFERRING') {
          newStatus = 'pending'
        }

        await supabase
          .from('transactions')
          .update({ status: newStatus })
          .eq('id', transaction.id)

        if (newStatus === 'approved') {
          await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            title: '✅ Saque Concluído!',
            message: `Seu saque de R$ ${transaction.amount.toFixed(2)} foi enviado com sucesso!`,
            type: 'success',
          })
        } else if (newStatus === 'rejected') {
          // Return balance
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', transaction.user_id)
            .single()

          if (profile) {
            await supabase
              .from('profiles')
              .update({ balance: (profile.balance || 0) + transaction.amount })
              .eq('id', profile.id)
          }

          await supabase.from('notifications').insert({
            user_id: transaction.user_id,
            title: '❌ Saque Falhou',
            message: `Seu saque de R$ ${transaction.amount.toFixed(2)} falhou: ${payload.withdraw.rejectedReason || 'Erro desconhecido'}. O valor foi devolvido.`,
            type: 'error',
          })
        }
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  } catch (error) {
    console.error('Webhook error:', error)
    return new Response(
      JSON.stringify({ error: 'Internal error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
