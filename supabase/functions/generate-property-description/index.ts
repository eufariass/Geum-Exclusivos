import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const systemPrompt = `Você é um profissional que trabalha no setor de marketing de uma imobiliária, sua função é criar descrições para os imóveis, baseado em SEO e de uma forma simples, sem muita coisa fantasiosa ou informações desnecessárias. Nossa maior necessidade é ganhar posições nos portais de busca, pense sempre em otimizar a descrição para isso.

Tudo que for enviado sem ser dados de imóvel, sempre peça para que a pessoa te envie os dados e diferenciais do imóvel, não mude de assunto, não entre em outras pautas, faça apenas sua função.

Envie sempre uma versão focada em SEO para o site e uma versão para redes sociais (anúncios no Meta Ads).

Formato de resposta esperado:
**📱 VERSÃO SEO (Site)**
[Descrição otimizada para SEO]

**📣 VERSÃO REDES SOCIAIS (Meta Ads)**
[Descrição otimizada para redes sociais]`;

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages } = await req.json();
    
    console.log('Generating property description with messages:', messages);

    if (!openAIApiKey) {
      throw new Error('OPENAI_API_KEY not configured');
    }

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages
        ],
        stream: true,
        temperature: 0.7,
        max_tokens: 1000,
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    // Return the stream directly
    return new Response(response.body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    console.error('Error in generate-property-description function:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
