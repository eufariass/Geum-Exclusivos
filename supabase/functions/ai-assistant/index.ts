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

// --- Tool Definitions ---

const tools = [
    {
        type: "function",
        function: {
            name: "search_leads",
            description: "Buscar leads no banco de dados por nome, email ou telefone. Use SEMPRE antes de atualizar ou comentar em um lead.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Termo de busca (nome, email ou telefone do lead)."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_pipeline_stages",
            description: "Listar todas as etapas do funil de vendas (Kanban). Use para saber quais etapas existem e seus IDs antes de mover um lead.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_lead_stage",
            description: "Mover um lead para outra etapa do funil. IMPORTANTE: Primeiro use get_pipeline_stages para obter o stage_id correto.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: {
                        type: "string",
                        description: "O UUID do lead a ser movido."
                    },
                    stage_id: {
                        type: "string",
                        description: "O UUID da etapa de destino (obtido via get_pipeline_stages)."
                    }
                },
                required: ["lead_id", "stage_id"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "add_lead_comment",
            description: "Adicionar um comentário ou observação em um lead.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: {
                        type: "string",
                        description: "O UUID do lead."
                    },
                    comment: {
                        type: "string",
                        description: "O texto do comentário a ser adicionado."
                    }
                },
                required: ["lead_id", "comment"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_dashboard_stats",
            description: "Obter estatísticas gerais do funil de leads.",
            parameters: {
                type: "object",
                properties: {},
                required: []
            }
        }
    },
    {
        type: "function",
        function: {
            name: "search_properties",
            description: "Buscar imóveis por código, título, endereço, bairro ou tipo.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "Termo de busca (código, endereço, bairro ou tipo do imóvel)."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "get_property_details",
            description: "Obter detalhes completos de um imóvel específico. Use quando precisar criar uma descrição ou responder perguntas sobre um imóvel.",
            parameters: {
                type: "object",
                properties: {
                    property_id: {
                        type: "string",
                        description: "O UUID do imóvel."
                    }
                },
                required: ["property_id"]
            }
        }
    }
];

// --- System Prompt ---
const systemPrompt = `Você é o Assistente Virtual Inteligente da Geum Imob.

REGRA CRÍTICA: EXECUTE AS FERRAMENTAS IMEDIATAMENTE. 
NUNCA diga "vou fazer" ou "um momento" - simplesmente FAÇA usando as ferramentas.
Você DEVE chamar as ferramentas na mesma resposta, não em uma resposta futura.

## FERRAMENTAS DISPONÍVEIS:
- search_leads(query) - Buscar leads por nome/email/telefone
- get_pipeline_stages() - Listar etapas do Kanban
- update_lead_stage(lead_id, stage_id) - Mover lead para outra etapa
- add_lead_comment(lead_id, comment) - Adicionar comentário ao lead
- search_properties(query) - Buscar imóveis
- get_property_details(property_id) - Detalhes de um imóvel

## FLUXO PARA MOVER LEAD:
Quando o usuário pedir para mover um lead, chame AS TRÊS ferramentas DE UMA VEZ:
1. get_pipeline_stages() - para obter os IDs das etapas
2. search_leads("nome") - para obter o ID do lead
3. Após receber os resultados, chame update_lead_stage(lead_id, stage_id)

## FLUXO PARA COMENTAR:
1. search_leads("nome") - para obter o ID
2. add_lead_comment(lead_id, "comentário")

## COMPORTAMENTO:
- SEMPRE execute as ferramentas, nunca apenas descreva o que fará
- Se encontrar múltiplos leads, PERGUNTE qual é o correto
- Após executar, confirme o que foi feito
- Responda em Português do Brasil
`;

serve(async (req) => {
    // Handle CORS
    if (req.method === 'OPTIONS') {
        return new Response(null, { headers: corsHeaders });
    }

    try {
        const { messages } = await req.json();

        if (!openAIApiKey) {
            throw new Error('OPENAI_API_KEY_MISSING');
        }

        // Initialize Supabase Client with USER CONTEXT (using Authorization header)
        const authHeader = req.headers.get('Authorization');
        if (!authHeader) {
            throw new Error('Missing Authorization header');
        }

        // Create client with service role key for database operations
        // but still use the user's auth token for RLS
        const supabase = createClient(supabaseUrl, supabaseServiceKey, {
            global: { headers: { Authorization: authHeader } },
        });

        // 1. Call OpenAI with tools
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
                tools: tools,
                tool_choice: "required", // Força uso de ferramentas
                temperature: 0.1, // Baixíssima para garantir execução
                parallel_tool_calls: true, // Permite chamadas paralelas
            }),
        });

        const data = await response.json();

        if (data.error) {
            console.error("OpenAI Error:", data.error);
            throw new Error(`OpenAI Error: ${data.error.message}`);
        }

        const choice = data.choices[0];
        const message = choice.message;

        // 2. Handle Tool Calls
        if (message.tool_calls) {
            const toolMessages = [message]; // Start with the assistant's tool request

            for (const toolCall of message.tool_calls) {
                const functionName = toolCall.function.name;
                const args = JSON.parse(toolCall.function.arguments);
                let result = "";

                console.log(`Executing tool: ${functionName}`, args);

                try {
                    if (functionName === 'search_leads') {
                        // Buscar leads com join para pegar nome da etapa
                        const { data: leads, error } = await supabase
                            .from('leads')
                            .select(`
                                id, 
                                nome, 
                                email, 
                                telefone, 
                                stage_id,
                                stage:lead_pipeline_stages(id, name),
                                imovel:imoveis(codigo, endereco)
                            `)
                            .or(`nome.ilike.%${args.query}%,email.ilike.%${args.query}%,telefone.ilike.%${args.query}%`)
                            .limit(5);

                        if (error) throw error;

                        if (!leads || leads.length === 0) {
                            result = JSON.stringify({ found: false, message: "Nenhum lead encontrado com esses termos." });
                        } else {
                            result = JSON.stringify({
                                found: true,
                                count: leads.length,
                                leads: leads.map((l: any) => ({
                                    id: l.id,
                                    nome: l.nome,
                                    contato: `${l.email || 'Sem email'} | ${l.telefone || 'Sem tel'}`,
                                    etapa_atual: l.stage?.name || 'Sem etapa',
                                    imovel: l.imovel ? `${l.imovel.codigo} - ${l.imovel.endereco}` : 'Sem imóvel vinculado'
                                }))
                            });
                        }
                    }
                    else if (functionName === 'get_pipeline_stages') {
                        const { data: stages, error } = await supabase
                            .from('lead_pipeline_stages')
                            .select('id, name, order_index, color, is_final, is_won')
                            .order('order_index');

                        if (error) throw error;

                        result = JSON.stringify({
                            stages: (stages || []).map((s: any) => ({
                                id: s.id,
                                nome: s.name,
                                ordem: s.order_index,
                                cor: s.color,
                                etapa_final: s.is_final,
                                ganho: s.is_won
                            }))
                        });
                    }
                    else if (functionName === 'update_lead_stage') {
                        // Buscar lead atual para registrar histórico
                        const { data: currentLead, error: leadError } = await supabase
                            .from('leads')
                            .select('stage_id, nome')
                            .eq('id', args.lead_id)
                            .single();

                        if (leadError || !currentLead) {
                            throw new Error("Lead não encontrado.");
                        }

                        const fromStageId = currentLead.stage_id;

                        // Atualizar lead
                        const { error: updateError } = await supabase
                            .from('leads')
                            .update({ stage_id: args.stage_id, updated_at: new Date().toISOString() })
                            .eq('id', args.lead_id);

                        if (updateError) throw updateError;

                        // Registrar no histórico
                        await supabase.from('lead_stage_history').insert({
                            lead_id: args.lead_id,
                            from_stage_id: fromStageId,
                            to_stage_id: args.stage_id,
                            changed_at: new Date().toISOString()
                        });

                        // Buscar nome da nova etapa para confirmar
                        const { data: newStage } = await supabase
                            .from('lead_pipeline_stages')
                            .select('name')
                            .eq('id', args.stage_id)
                            .single();

                        result = JSON.stringify({
                            success: true,
                            message: `Lead "${currentLead.nome}" movido para "${newStage?.name || 'nova etapa'}" com sucesso.`
                        });
                    }
                    else if (functionName === 'add_lead_comment') {
                        // Verificar se lead existe
                        const { data: lead, error: leadError } = await supabase
                            .from('leads')
                            .select('id, nome')
                            .eq('id', args.lead_id)
                            .single();

                        if (leadError || !lead) {
                            throw new Error("Lead não encontrado (ID inválido).");
                        }

                        // Inserir comentário na tabela correta (lead_comments)
                        const { error } = await supabase
                            .from('lead_comments')
                            .insert({
                                lead_id: args.lead_id,
                                comment: args.comment,
                                created_at: new Date().toISOString()
                            });

                        if (error) throw error;
                        result = JSON.stringify({
                            success: true,
                            message: `Comentário adicionado ao lead "${lead.nome}" com sucesso.`
                        });
                    }
                    else if (functionName === 'get_dashboard_stats') {
                        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
                        result = JSON.stringify({ total_leads: count });
                    }
                    else if (functionName === 'search_properties') {
                        const { data: props, error } = await supabase
                            .from('imoveis')
                            .select('id, codigo, titulo, tipo, cidade, bairro, valor')
                            .or(`codigo.ilike.%${args.query}%,titulo.ilike.%${args.query}%,bairro.ilike.%${args.query}%,tipo.ilike.%${args.query}%`)
                            .limit(5);

                        if (error) throw error;
                        result = JSON.stringify(props);
                    }
                    else if (functionName === 'get_property_details') {
                        const { data: prop, error } = await supabase
                            .from('imoveis')
                            .select('*')
                            .eq('id', args.property_id)
                            .single();

                        if (error) throw error;
                        result = JSON.stringify(prop);
                    }
                } catch (err) {
                    console.error(`Error executing ${functionName}:`, err);
                    result = JSON.stringify({ error: err instanceof Error ? err.message : String(err) });
                }

                toolMessages.push({
                    tool_call_id: toolCall.id,
                    role: "tool",
                    name: functionName,
                    content: result
                });
            }

            // 3. Follow-up call to OpenAI
            const followUpResponse = await fetch('https://api.openai.com/v1/chat/completions', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${openAIApiKey}`,
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    model: 'gpt-4o-mini',
                    messages: [
                        { role: 'system', content: systemPrompt },
                        ...messages,
                        ...toolMessages
                    ],
                    temperature: 0.4, // Balanced for creativity + accuracy
                }),
            });

            const followUpData = await followUpResponse.json();
            return new Response(JSON.stringify(followUpData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } else {
            // No tool called
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Error in ai-assistant:', error);
        // ... error handling
        if (error instanceof Error && error.message === 'OPENAI_API_KEY_MISSING') {
            return new Response(JSON.stringify({ error: 'OPENAI_API_KEY_MISSING' }), {
                status: 400,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }
        return new Response(
            JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
            {
                status: 500,
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            }
        );
    }
});
