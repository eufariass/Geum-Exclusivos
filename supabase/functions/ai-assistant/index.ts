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
            description: "Search for leads in the database by name, email, or phone. Use this to find a lead before updating them.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query (name, email, phone)."
                    }
                },
                required: ["query"]
            }
        }
    },
    {
        type: "function",
        function: {
            name: "update_lead_stage",
            description: "Move a lead to a specific stage in the pipeline.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: {
                        type: "string",
                        description: "The UUID of the lead to update."
                    },
                    stage_id: {
                        type: "string",
                        description: "The ID of the target stage (e.g., 'novo-lead', 'qualificacao', 'visita', 'proposta', 'fechamento', 'perdido')."
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
            description: "Add a comment or note to a lead's history.",
            parameters: {
                type: "object",
                properties: {
                    lead_id: {
                        type: "string",
                        description: "The UUID of the lead."
                    },
                    comment: {
                        type: "string",
                        description: "The comment text to add."
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
            description: "Get general statistics about the leads pipeline.",
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
            description: "Search for properties (imóveis) by code, title, address, or type.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query (code, address, neighborhood, type)."
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
            description: "Get full details of a specific property by ID. Use this when you need to write a description or answer specific questions about a property.",
            parameters: {
                type: "object",
                properties: {
                    property_id: {
                        type: "string",
                        description: "The UUID of the property."
                    }
                },
                required: ["property_id"]
            }
        }
    }
];

// --- System Prompt ---
const systemPrompt = `Você é o Assistente Virtual Inteligente da Geum Imob. 
Sua missão é auxiliar corretores e administradores a:
1. Gerenciar LEADS (crm).
2. Consultar e criar conteúdos para IMÓVEIS.

FERRAMENTAS:
Você TEM acesso direto ao banco de dados via ferramentas (tools). 
NUNCA diga "não tenho acesso ao banco". USE AS FERRAMENTAS.

REGRAS DE OURO - LEADS:
1. **Identificação Precisa**: Antes de alterar ou comentar em um lead, tenha CERTEZA de quem é. 
   - Se o usuário disser "Mude o João de etapa", USE \`search_leads("João")\`.
   - Se a busca retornar mais de um "João", **PERGUNTE** ao usuário qual deles é (mostre nome, email/telefone e etapa atual).
   - Se não encontrar ninguém, avise e peça para verificar o nome.
   - Só prossiga com a ação quando tiver um ID confirmado.

REGRAS DE OURO - IMÓVEIS:
1. Você pode buscar imóveis por código, bairro, tipo, etc.
2. **Descrições**: Se pedirem para "Criar uma descrição" para um imóvel:
   - Primeiro busque o imóvel para achar o ID.
   - Depois use \`get_property_details(id)\` para ler todas as características.
   - Com os dados, escreva uma descrição vendedora, criativa e profissional, destacando os pontos fortes.

PERSONALIDADE:
- Profissional, eficiente e proativo.
- Responda em Português do Brasil.
- Se ocorrer um erro técnico, explique de forma simples.
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

        // Create client scoped to the user (respects RLS)
        const supabase = createClient(supabaseUrl, authHeader.replace('Bearer ', ''), {
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
                tool_choice: "auto",
                temperature: 0.2, // Lower temperature to force tool usage accuracy
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
                        const { data: leads, error } = await supabase
                            .from('leads')
                            .select('id, name, email, telefone, stage_id, updated_at')
                            .or(`name.ilike.%${args.query}%,email.ilike.%${args.query}%,telefone.ilike.%${args.query}%`)
                            .limit(5);

                        if (error) throw error;

                        if (!leads || leads.length === 0) {
                            result = JSON.stringify({ found: false, message: "Nenhum lead encontrado com esses termos." });
                        } else {
                            result = JSON.stringify({
                                found: true,
                                count: leads.length,
                                leads: leads.map(l => ({
                                    id: l.id,
                                    name: l.name,
                                    info: `${l.email || 'Sem email'} | ${l.telefone || 'Sem tel'}`,
                                    stage: l.stage_id, // AI handles raw IDs, but meaningful names would be better if possible. 
                                    // ideally we join with stages table, but let's keep it simple for now.
                                }))
                            });
                        }
                    }
                    else if (functionName === 'update_lead_stage') {
                        const { error } = await supabase
                            .from('leads')
                            .update({ stage_id: args.stage_id, updated_at: new Date().toISOString() })
                            .eq('id', args.lead_id);

                        if (error) throw error;
                        result = JSON.stringify({ success: true, message: "Lead movido com sucesso." });
                    }
                    else if (functionName === 'add_lead_comment') {
                        // Confirm lead exists/get stage
                        const { data: lead } = await supabase.from('leads').select('stage_id').eq('id', args.lead_id).single();

                        if (lead) {
                            const { error } = await supabase
                                .from('lead_stage_history')
                                .insert({
                                    lead_id: args.lead_id,
                                    from_stage_id: lead.stage_id,
                                    to_stage_id: lead.stage_id,
                                    notes: args.comment,
                                    changed_at: new Date().toISOString()
                                });
                            if (error) throw error;
                            result = JSON.stringify({ success: true, message: "Comentário registrado no histórico." });
                        } else {
                            throw new Error("Lead não encontrado (ID inválido).");
                        }
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
                    result = JSON.stringify({ error: err.message });
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
        if (error.message === 'OPENAI_API_KEY_MISSING') {
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
