import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

const VERIFY_TOKEN = Deno.env.get('FACEBOOK_WEBHOOK_VERIFY_TOKEN')
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const url = new URL(req.url)

    // GET request - Facebook webhook verification
    if (req.method === 'GET') {
      const mode = url.searchParams.get('hub.mode')
      const token = url.searchParams.get('hub.verify_token')
      const challenge = url.searchParams.get('hub.challenge')

      console.log('Webhook verification request:', { mode, token: token ? 'present' : 'missing' })

      // Verify token matches
      if (mode === 'subscribe' && token === VERIFY_TOKEN) {
        console.log('Webhook verified successfully')
        return new Response(challenge, {
          status: 200,
          headers: { 'Content-Type': 'text/plain' }
        })
      } else {
        console.error('Webhook verification failed')
        return new Response('Forbidden', { status: 403 })
      }
    }

    // POST request - Receive webhook events
    if (req.method === 'POST') {
      const body = await req.json()
      console.log('Received webhook event:', JSON.stringify(body, null, 2))

      const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

      // Process each entry in the webhook payload
      for (const entry of body.entry || []) {
        console.log('Processing entry:', entry.id)

        // Process changes
        for (const change of entry.changes || []) {
          const { field, value } = change
          console.log('Processing change:', { field, value })

          // Handle ad account updates
          if (field === 'adaccount') {
            await handleAdAccountChange(supabase, value)
          }

          // Handle campaign updates
          if (field === 'campaign') {
            await handleCampaignChange(supabase, value)
          }

          // Handle ad updates
          if (field === 'ad') {
            await handleAdChange(supabase, value)
          }

          // Handle lead updates
          if (field === 'leadgen') {
            await handleLeadgenChange(supabase, value)
          }
        }
      }

      return new Response(
        JSON.stringify({ success: true, message: 'Webhook processed' }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      )
    }

    return new Response('Method not allowed', { status: 405 })
  } catch (error) {
    console.error('Error processing webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})

async function handleAdAccountChange(supabase: any, value: any) {
  console.log('Ad account change:', value)

  // Log the event for debugging
  await supabase.from('meta_sync_logs').insert({
    event_type: 'webhook_adaccount',
    status: 'received',
    details: value,
    synced_at: new Date().toISOString()
  })

  // TODO: Implement specific ad account change logic
  // For example, update account status, budget changes, etc.
}

async function handleCampaignChange(supabase: any, value: any) {
  console.log('Campaign change:', value)

  const { campaign_id, status } = value

  if (!campaign_id) {
    console.warn('No campaign_id in webhook payload')
    return
  }

  // Log the event
  await supabase.from('meta_sync_logs').insert({
    event_type: 'webhook_campaign',
    status: 'received',
    details: value,
    synced_at: new Date().toISOString()
  })

  // Find the campaign in our database
  const { data: campaigns, error: fetchError } = await supabase
    .from('meta_campaigns')
    .select('*')
    .eq('campaign_id', campaign_id)

  if (fetchError) {
    console.error('Error fetching campaign:', fetchError)
    return
  }

  if (campaigns && campaigns.length > 0) {
    const campaign = campaigns[0]
    console.log('Found campaign in database:', campaign.id)

    // Update campaign status if provided
    if (status) {
      await supabase
        .from('meta_campaigns')
        .update({
          status,
          updated_at: new Date().toISOString()
        })
        .eq('id', campaign.id)

      console.log('Updated campaign status to:', status)
    }

    // Trigger metrics sync for this campaign
    // This will fetch the latest metrics from Meta API
    await triggerMetricsSync(supabase, campaign.meta_account_id, campaign_id)
  }
}

async function handleAdChange(supabase: any, value: any) {
  console.log('Ad change:', value)

  await supabase.from('meta_sync_logs').insert({
    event_type: 'webhook_ad',
    status: 'received',
    details: value,
    synced_at: new Date().toISOString()
  })

  // TODO: Implement specific ad change logic
}

async function handleLeadgenChange(supabase: any, value: any) {
  console.log('Lead generation change:', value)

  await supabase.from('meta_sync_logs').insert({
    event_type: 'webhook_leadgen',
    status: 'received',
    details: value,
    synced_at: new Date().toISOString()
  })

  // TODO: Implement lead capture logic
  // This could create new leads in your CRM
}

async function triggerMetricsSync(supabase: any, metaAccountId: string, campaignId?: string) {
  console.log('Triggering metrics sync for account:', metaAccountId, 'campaign:', campaignId)

  // This would call your sync-meta-ads function
  // For now, just log the intent
  await supabase.from('meta_sync_logs').insert({
    event_type: 'sync_triggered',
    status: 'pending',
    details: { metaAccountId, campaignId, trigger: 'webhook' },
    synced_at: new Date().toISOString()
  })
}
