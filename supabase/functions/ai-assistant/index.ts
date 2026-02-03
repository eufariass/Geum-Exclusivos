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
            description: "Search for leads in the database by name, email, or stage.",
            parameters: {
                type: "object",
                properties: {
                    query: {
                        type: "string",
                        description: "The search query (name, email, etc)."
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
                        description: "The ID of the target stage (e.g., 'novo-lead', 'qualificacao', 'encerrado')."
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
    }
];

// --- System Prompt ---
const systemPrompt = `Você é o Assistente Virtual da Geum Imob. Sua função é ajudar corretores e administradores a gerenciar leads e tarefas no CRM de forma rápida e eficiente.
Você tem acesso direto ao banco de dados através de ferramentas. Sempre que o usuário pedir algo que exija dados, USE AS FERRAMENTAS.

Regras:
1. Seja educado, profissional e objetivo.
2. Se o usuário pedir para mudar um lead de etapa, primeiro PEQUISE o lead para obter o ID, se não for fornecido.
3. Se o usuário pedir para adicionar um comentário, faça o mesmo.
4. Responda em português do Brasil.
5. Se uma ação falhar (erro de permissão, etc.), avise o usuário claramente.
6. Não invente IDs. Use apenas os IDs retornados pelas buscas.
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

        // Also create a service client for read-only metadata if needed, but primarily use user client for actions
        // const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

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
                temperature: 0.3, // Lower temperature for actions
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
                            .select('id, name, email, stage_id, imovel_arbo_id')
                            .or(`name.ilike.%${args.query}%,email.ilike.%${args.query}%`)
                            .limit(5);

                        if (error) throw error;
                        result = JSON.stringify(leads);
                    }
                    else if (functionName === 'update_lead_stage') {
                        const { error } = await supabase
                            .from('leads')
                            .update({ stage_id: args.stage_id, updated_at: new Date().toISOString() })
                            .eq('id', args.lead_id);

                        if (error) throw error;
                        result = JSON.stringify({ success: true, message: "Lead updated successfully" });
                    }
                    else if (functionName === 'add_lead_comment') {
                        // Check if we have a table for comments. If not, maybe we use notes or a separate table.
                        // Based on schema analysis, 'lead_stage_history' has 'notes'. 
                        // Or typically there is a 'lead_interactions' or 'comments' table.
                        // Let's assume we append to a timeline or create a generic task/note.
                        // For now, let's look for a comments table or use lead_stage_history as a log.
                        // Actually, the user asked to "incluir um comentario". 
                        // In the absence of a verified 'comments' table, I will use 'lead_stage_history' to log this event OR check if I missed a table.
                        // Re-reading schema: `lead_stage_history` has `notes`. This fits "comentario".
                        // However, we need 'from_stage_id' and 'to_stage_id'. 
                        // Let's try to fetch current stage first.

                        const { data: lead } = await supabase.from('leads').select('stage_id').eq('id', args.lead_id).single();

                        if (lead) {
                            const { error } = await supabase
                                .from('lead_stage_history')
                                .insert({
                                    lead_id: args.lead_id,
                                    from_stage_id: lead.stage_id,
                                    to_stage_id: lead.stage_id, // No change
                                    notes: args.comment,
                                    changed_at: new Date().toISOString()
                                });
                            if (error) throw error;
                            result = JSON.stringify({ success: true, message: "Comment added" });
                        } else {
                            throw new Error("Lead not found");
                        }
                    }
                    else if (functionName === 'get_dashboard_stats') {
                        // Simple stats
                        const { count } = await supabase.from('leads').select('*', { count: 'exact', head: true });
                        result = JSON.stringify({ total_leads: count });
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

            // 3. Follow-up call to OpenAI to get the final natural language response
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
                    temperature: 0.7,
                }),
            });

            const followUpData = await followUpResponse.json();
            return new Response(JSON.stringify(followUpData), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });

        } else {
            // No tool called, just return the message
            return new Response(JSON.stringify(data), {
                headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            });
        }

    } catch (error) {
        console.error('Error in ai-assistant:', error);

        // Check if it's the specific missing key error
        if (error.message === 'OPENAI_API_KEY_MISSING') {
            return new Response(JSON.stringify({ error: 'OPENAI_API_KEY_MISSING' }), {
                status: 400, // Bad Request
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
