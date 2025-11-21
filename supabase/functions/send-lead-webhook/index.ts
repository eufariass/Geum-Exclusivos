import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.81.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface LeadWebhookPayload {
  lead_id: string;
  nome: string;
  telefone: string;
  imovel_id: string;
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const payload: LeadWebhookPayload = await req.json();
    console.log('Received lead webhook payload:', payload);

    // Buscar informações do imóvel
    const { data: imovel, error: imovelError } = await supabase
      .from('imoveis')
      .select('codigo, titulo, endereco')
      .eq('id', payload.imovel_id)
      .single();

    if (imovelError) {
      console.error('Erro ao buscar imóvel:', imovelError);
      throw imovelError;
    }

    // Preparar dados para envio ao n8n
    const webhookData = {
      nome_lead: payload.nome,
      contato: payload.telefone,
      imovel_interesse: {
        codigo: imovel.codigo,
        titulo: imovel.titulo,
        endereco: imovel.endereco,
      },
    };

    console.log('Sending to n8n webhook:', webhookData);

    // Enviar para o webhook
    const webhookResponse = await fetch('https://webhook.foradacasa.com/webhook/exclusivos', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(webhookData),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook response error:', await webhookResponse.text());
      throw new Error(`Webhook failed with status: ${webhookResponse.status}`);
    }

    console.log('Webhook sent successfully');

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error in send-lead-webhook:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
