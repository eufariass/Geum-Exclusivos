import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { image } = await req.json();

    if (!image) {
      return new Response(
        JSON.stringify({ error: 'Imagem não fornecida' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Analisando imagem com GPT-4o...');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o',
        messages: [
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: `Analise esta imagem de um gerenciador de anúncios (Meta Ads, Google Ads, ou similar) e extraia as métricas.

Retorne APENAS um JSON válido com a seguinte estrutura:
{
  "leads": número de leads/conversões/contatos gerados (obrigatório),
  "visualizacoes": número de impressões/alcance/visualizações (obrigatório),
  "visitas": número de cliques/visitas ao site/landing page (obrigatório),
  "periodo": "YYYY-MM" se você conseguir identificar o período/mês na imagem,
  "plataforma": "Meta Ads" | "Google Ads" | "TikTok Ads" | "LinkedIn Ads" | "Outro",
  "confianca": "alta" | "media" | "baixa" (baseado na sua certeza da extração)
}

IMPORTANTE:
- Se não conseguir identificar algum valor numérico, retorne 0
- Procure por: "Leads", "Conversões", "Contatos", "Resultados"
- Para visualizações: "Impressões", "Alcance", "Visualizações", "Impressions", "Reach"
- Para visitas: "Cliques", "Clicks", "Visitas ao site", "Link clicks"
- Retorne APENAS o JSON, sem texto adicional`
              },
              {
                type: 'image_url',
                image_url: {
                  url: image
                }
              }
            ]
          }
        ],
        max_tokens: 500,
        temperature: 0.1
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Erro da OpenAI:', response.status, errorText);
      return new Response(
        JSON.stringify({ error: 'Erro ao processar imagem com IA', details: errorText }),
        { status: response.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const content = data.choices[0].message.content;
    
    console.log('Resposta da IA:', content);

    // Parse JSON da resposta
    let extractedData;
    try {
      // Remove markdown code blocks se existirem
      const cleanContent = content.replace(/```json\n?|\n?```/g, '').trim();
      extractedData = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error('Erro ao fazer parse da resposta:', parseError);
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair dados estruturados da imagem' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validar e garantir que os valores sejam números
    const validatedData = {
      leads: Number(extractedData.leads) || 0,
      visualizacoes: Number(extractedData.visualizacoes) || 0,
      visitas: Number(extractedData.visitas) || 0,
      periodo: extractedData.periodo || null,
      plataforma: extractedData.plataforma || 'Outro',
      confianca: extractedData.confianca || 'baixa'
    };

    console.log('Dados validados:', validatedData);

    return new Response(
      JSON.stringify(validatedData),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Erro na função extract-metrics-from-image:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
