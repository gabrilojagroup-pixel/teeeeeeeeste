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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Fetch all active investments
    const { data: investments, error: investmentsError } = await supabase
      .from('user_investments')
      .select(`
        id,
        user_id,
        amount,
        daily_return,
        plan_id,
        start_date,
        end_date,
        status
      `)
      .eq('status', 'active')
      .lte('end_date', new Date().toISOString())

    if (investmentsError) {
      throw new Error(`Failed to fetch investments: ${investmentsError.message}`)
    }

    // Filter to only process investments that haven't ended yet
    const now = new Date()
    const activeInvestments = investments?.filter(inv => new Date(inv.end_date) > now) || []

    // Also get investments that need to end today
    const { data: allActiveInvestments, error: allError } = await supabase
      .from('user_investments')
      .select(`
        id,
        user_id,
        amount,
        daily_return,
        plan_id,
        start_date,
        end_date,
        status
      `)
      .eq('status', 'active')

    if (allError) {
      throw new Error(`Failed to fetch all investments: ${allError.message}`)
    }

    const processedReturns: string[] = []
    const completedInvestments: string[] = []

    for (const investment of allActiveInvestments || []) {
      const endDate = new Date(investment.end_date)
      const startDate = new Date(investment.start_date)
      
      // Check if investment has ended
      if (endDate <= now) {
        // Mark investment as completed
        await supabase
          .from('user_investments')
          .update({ status: 'completed' })
          .eq('id', investment.id)
        
        completedInvestments.push(investment.id)
        continue
      }

      // Check if we should process daily return (at least 24h since start)
      const hoursSinceStart = (now.getTime() - startDate.getTime()) / (1000 * 60 * 60)
      if (hoursSinceStart < 24) {
        continue // Skip if less than 24 hours since start
      }

      // Calculate days since start to check if return was already processed today
      const today = new Date().toISOString().split('T')[0]
      
      // Check if return was already processed today
      const { data: existingTransaction } = await supabase
        .from('transactions')
        .select('id')
        .eq('user_id', investment.user_id)
        .eq('type', 'return')
        .eq('description', `Rendimento diário - Investimento ${investment.id.substring(0, 8)}`)
        .gte('created_at', `${today}T00:00:00`)
        .lte('created_at', `${today}T23:59:59`)
        .maybeSingle()

      if (existingTransaction) {
        continue // Already processed today
      }

      const dailyReturn = Number(investment.daily_return)

      // Add return to accumulated_balance
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('accumulated_balance')
        .eq('user_id', investment.user_id)
        .maybeSingle()

      if (profileError || !profile) {
        console.error(`Failed to fetch profile for user ${investment.user_id}`)
        continue
      }

      const newAccumulatedBalance = Number(profile.accumulated_balance) + dailyReturn

      // Update accumulated balance
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ accumulated_balance: newAccumulatedBalance })
        .eq('user_id', investment.user_id)

      if (updateError) {
        console.error(`Failed to update balance for user ${investment.user_id}: ${updateError.message}`)
        continue
      }

      // Record transaction
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: investment.user_id,
          type: 'return',
          amount: dailyReturn,
          status: 'completed',
          description: `Rendimento diário - Investimento ${investment.id.substring(0, 8)}`
        })

      if (transactionError) {
        console.error(`Failed to record transaction: ${transactionError.message}`)
        continue
      }

      processedReturns.push(investment.id)
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: 'Daily returns processed successfully',
        processedReturns: processedReturns.length,
        completedInvestments: completedInvestments.length,
        details: {
          processedIds: processedReturns,
          completedIds: completedInvestments
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    console.error('Error processing daily returns:', error)
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: errorMessage 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500
      }
    )
  }
})
