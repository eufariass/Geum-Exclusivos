import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { metaAccountId } = await req.json()

    if (!metaAccountId) {
      return new Response(
        JSON.stringify({ error: 'metaAccountId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // Get Meta account details
    const { data: metaAccount, error: accountError } = await supabase
      .from('meta_accounts')
      .select('*')
      .eq('id', metaAccountId)
      .single()

    if (accountError || !metaAccount) {
      throw new Error('Meta account not found')
    }

    // Start sync log
    const { data: syncLog } = await supabase
      .from('meta_sync_logs')
      .insert({
        meta_account_id: metaAccountId,
        sync_type: 'full',
        status: 'running',
      })
      .select()
      .single()

    let campaignsSynced = 0
    let metricsSynced = 0
    let errorMessage = null

    try {
      // Fetch campaigns from Meta API
      const campaignsResponse = await fetch(
        `https://graph.facebook.com/v18.0/${metaAccount.account_id}/campaigns?` +
        `fields=id,name,status,objective,effective_status` +
        `&access_token=${metaAccount.access_token}`
      )

      if (!campaignsResponse.ok) {
        throw new Error('Failed to fetch campaigns from Meta API')
      }

      const campaignsData = await campaignsResponse.json()
      const campaigns = campaignsData.data || []

      campaignsSynced = campaigns.length

      // Fetch linked campaigns from database
      const { data: linkedCampaigns } = await supabase
        .from('meta_campaigns')
        .select('*')
        .eq('meta_account_id', metaAccountId)

      // For each linked campaign, fetch metrics
      if (linkedCampaigns && linkedCampaigns.length > 0) {
        for (const campaign of linkedCampaigns) {
          const metaCampaign = campaigns.find((c: any) => c.id === campaign.campaign_id)

          if (metaCampaign) {
            // Update campaign status
            await supabase
              .from('meta_campaigns')
              .update({
                status: metaCampaign.effective_status,
                objective: metaCampaign.objective,
                updated_at: new Date().toISOString(),
              })
              .eq('id', campaign.id)

            // Fetch insights (metrics) for the last 30 days
            const today = new Date()
            const thirtyDaysAgo = new Date(today)
            thirtyDaysAgo.setDate(today.getDate() - 30)

            const insightsResponse = await fetch(
              `https://graph.facebook.com/v18.0/${campaign.campaign_id}/insights?` +
              `fields=impressions,clicks,spend,reach,frequency,ctr,cpc,cpm,actions` +
              `&time_range={'since':'${thirtyDaysAgo.toISOString().split('T')[0]}','until':'${today.toISOString().split('T')[0]}'}` +
              `&time_increment=1` +
              `&access_token=${metaAccount.access_token}`
            )

            if (insightsResponse.ok) {
              const insightsData = await insightsResponse.json()
              const insights = insightsData.data || []

              // Process and save metrics
              const metricsToSave = insights.map((insight: any) => {
                const leads = insight.actions?.find((a: any) => a.action_type === 'lead')?.value || 0
                const conversions = insight.actions?.find((a: any) => a.action_type === 'offsite_conversion')?.value || 0

                return {
                  meta_campaign_id: campaign.id,
                  date: insight.date_start,
                  impressions: parseInt(insight.impressions) || 0,
                  clicks: parseInt(insight.clicks) || 0,
                  spend: parseFloat(insight.spend) || 0,
                  reach: parseInt(insight.reach) || 0,
                  frequency: parseFloat(insight.frequency) || 0,
                  ctr: parseFloat(insight.ctr) || 0,
                  cpc: parseFloat(insight.cpc) || 0,
                  cpm: parseFloat(insight.cpm) || 0,
                  leads: parseInt(leads),
                  cost_per_lead: leads > 0 ? parseFloat(insight.spend) / parseInt(leads) : 0,
                  conversions: parseInt(conversions),
                  conversion_rate: insight.clicks > 0 ? (parseInt(conversions) / parseInt(insight.clicks)) * 100 : 0,
                  video_views: 0,
                  link_clicks: parseInt(insight.clicks) || 0,
                }
              })

              if (metricsToSave.length > 0) {
                await supabase
                  .from('meta_campaign_metrics')
                  .upsert(metricsToSave)

                metricsSynced += metricsToSave.length
              }
            }
          }
        }
      }

      // Update sync log as success
      await supabase
        .from('meta_sync_logs')
        .update({
          status: 'success',
          campaigns_synced: campaignsSynced,
          metrics_synced: metricsSynced,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)

      return new Response(
        JSON.stringify({
          success: true,
          message: 'Sync completed successfully',
          campaignsSynced,
          metricsSynced,
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )

    } catch (syncError: any) {
      errorMessage = syncError.message

      // Update sync log as failed
      await supabase
        .from('meta_sync_logs')
        .update({
          status: 'failed',
          error_message: errorMessage,
          campaigns_synced: campaignsSynced,
          metrics_synced: metricsSynced,
          completed_at: new Date().toISOString(),
        })
        .eq('id', syncLog.id)

      throw syncError
    }

  } catch (error: any) {
    console.error('Error in sync-meta-ads:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
