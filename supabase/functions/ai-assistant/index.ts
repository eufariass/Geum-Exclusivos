import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.7.1";

const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const tools = [
    {
        type: "function",
        function: {
            name: "search_leads",
            description: "Buscar leads no banco de dados por nome, email ou telefone.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Termo de busca (nome, email ou telefone)." }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_pipeline_stages",
            description: "Listar todas as etapas do funil de vendas (Kanban).",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "update_lead_stage",
            description: "Mover um lead para outra etapa do funil.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: { type: "string", description: "O UUID do lead." },
                    stage_id: { type: "string", description: "O UUID da etapa de destino." }
                },
                required: ["lead_id", "stage_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_lead_comment",
            description: "Adicionar um comentário em um lead.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: { type: "string", description: "O UUID do lead." },
                    comment: { type: "string", description: "O texto do comentário." }
                },
                required: ["lead_id", "comment"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_dashboard_stats",
            description: "Obter estatísticas gerais do funil.",
            parameters: { type: "object", properties: {}, required: [] }
        }
    },
    {
        type: "function",
        function: {
            name: "search_properties",
            description: "Buscar imóveis por código, endereço, bairro ou tipo.",
            parameters: {
                type: "object",
                properties: {
                    query: { type: "string", description: "Termo de busca." }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_property_details",
            description: "Obter detalhes de um imóvel específico.",
            parameters: {
                type: "object",
                properties: {
                    property_id: { type: "string", description: "O UUID do imóvel." }
                },
                required: ["property_id"]
            }
        }
    }
];

const systemPrompt = `Você é o Assistente Virtual da Geum Imob.

REGRA CRÍTICA: EXECUTE AS FERRAMENTAS IMEDIATAMENTE. 
NUNCA diga "vou fazer" ou "um momento" - simplesmente FAÇA.

FERRAMENTAS:
- search_leads(query) - Buscar leads
- get_pipeline_stages() - Listar etapas do Kanban
- update_lead_stage(lead_id, stage_id) - Mover lead
- add_lead_comment(lead_id, comment) - Comentar no lead
- search_properties(query) - Buscar imóveis
- get_property_details(property_id) - Detalhes do imóvel

PARA MOVER LEAD:
1. Chame get_pipeline_stages() e search_leads("nome") juntos
2. Com os IDs, chame update_lead_stage(lead_id, stage_id)

COMPORTAMENTO:
- SEMPRE execute as ferramentas imediatamente
- Se encontrar múltiplos leads, pergunte qual é
- Confirme após executar
- Responda em Português
`;

serve(async (req) => {
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { messages } = await req.json();

        if (!openAIApiKey) throw new Error('OPENAI_API_KEY_MISSING');

        const authHeader = req.headers.get('Authorization');
        if (!authHeader) throw new Error('Missing Authorization header');

        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        const response = await fetch('https://api.openai.com/v1/chat/completions', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${openAIApiKey}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'gpt-4o-mini',
                messages: [{ role: 'system', content: systemPrompt }, ...messages],
                tools: tools,
                tool_choice: "required",
                temperature: 0.1,
                parallel_tool_calls: true,
            }),
        });

        const data = await response.json();
        if (data.error) throw new Error(`OpenAI Error: ${data.error.message}`);

        const message = data.choices[0].message;

        if (message.tool_calls) {
            const toolMessages = [message];

            for (const toolCall of message.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = "";

                try {
                    if (functionName === 'search_leads') {
                        const { data: leads, error } = await supabase
                            .from('leads')
                            .select(`id, nome, email, telefone, stage:lead_pipeline_stages(name), imovel:imoveis(codigo, endereco)`)
                            .or(`nome.ilike.%${args.query}%,email.ilike.%${args.query}%,telefone.ilike.%${args.query}%`)
                            .limit(5);
                        if (error) throw error;
                        result = JSON.stringify(!leads?.length 
                            ? { found: false, message: "Nenhum lead encontrado." }
                            : { found: true, count: leads.length, leads: leads.map((l: any) => ({
                                id: l.id, nome: l.nome,
                                contato: `${l.email || ''} | ${l.telefone || ''}`,
                                etapa: l.stage?.name || 'Sem etapa'
                            }))});
                    }
                    else if (functionName === 'get_pipeline_stages') {
                        const { data: stages, error } = await supabase
                            .from('lead_pipeline_stages')
                            .select('id, name, order_index')
                            .order('order_index');
                        if (error) throw error;
                        result = JSON.stringify({ stages: stages?.map((s: any) => ({ id: s.id, nome: s.name })) });
                    }
                    else if (functionName === 'update_lead_stage') {
                        const { data: lead } = await supabase.from('leads').select('stage_id, nome').eq('id', args.lead_id).single();
                        if (!lead) throw new Error("Lead não encontrado.");
                        
                        await supabase.from('leads').update({ stage_id: args.stage_id, updated_at: new Date().toISOString() }).eq('id', args.lead_id);
                        await supabase.from('lead_stage_history').insert({ lead_id: args.lead_id, from_stage_id: lead.stage_id, to_stage_id: args.stage_id, changed_at: new Date().toISOString() });
                        
                        const { data: stage } = await supabase.from('lead_pipeline_stages').select('name').eq('id', args.stage_id).single();
                        result = JSON.stringify({ success: true, message: `Lead "${lead.nome}" movido para "${stage?.name}".` });
                    }
                    else if (functionName === 'add_lead_comment') {
                        const { data: lead } = await supabase.from('leads').select('nome').eq('id', args.lead_id).single();
                        if (!lead) throw new Error("Lead não encontrado.");
                        await supabase.from('lead_comments').insert({ lead_id: args.lead_id, comment: args.comment, created_at: new Date().toISOString() });
                        result = JSON.stringify({ success: true, message: `Comentário adicionado ao lead "${lead.nome}".` });
                    }
                    else if (functionName === 'get_dashboard_stats') {
                        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
                        result = JSON.stringify({ total_leads: count });
                    }
                    else if (functionName === 'search_properties') {
                        const { data: props, error } = await supabase.from('imoveis')
                            .select('id, codigo, titulo, tipo, bairro, valor')
                            .or(`codigo.ilike.%${args.query}%,titulo.ilike.%${args.query}%,bairro.ilike.%${args.query}%,tipo.ilike.%${args.query}%`)
                            .limit(5);
                        if (error) throw error;
                        result = JSON.stringify(props);
                    }
                    else if (functionName === 'get_property_details') {
                        const { data: prop, error } = await supabase.from('imoveis').select('*').eq('id', args.property_id).single();
                        if (error) throw error;
                        result = JSON.stringify(prop);
                    }
                } catch (err) {
                    result = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
                }

                toolMessages.push({ tool_call_id: toolCall.id, role: "tool", name: functionName, content: result });
            }

            const followUp = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${openAIApiKey}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [{ role: 'system', content: systemPrompt }, ...messages, ...toolMessages],
                    temperature: 0.4,
                }),
            });

            return new Response(JSON.stringify(await followUp.json()), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    } catch (error) {
        console.error('Error:', error);
        return new Response(JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }), {
            status: error instanceof Error && error.message === 'OPENAI_API_KEY_MISSING' ? 400 : 500,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
    }
});
