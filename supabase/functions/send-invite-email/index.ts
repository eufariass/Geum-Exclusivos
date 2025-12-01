import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const resendApiKey = Deno.env.get('RESEND_API_KEY');

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InviteEmailRequest {
  email: string;
  userName: string;
  role: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    console.log('Send invite email function invoked');
    
    const { email, userName, role }: InviteEmailRequest = await req.json();
    console.log('Processing invite email for:', email, 'with role:', role);

    // URLs do sistema e da logo
    const systemUrl = `${Deno.env.get('SUPABASE_URL')?.replace('.supabase.co', '.lovable.app') || 'https://geum-crm.lovable.app'}`;
    const setupPasswordUrl = `${systemUrl}/definir-senha`;
    const logoUrl = `${Deno.env.get('SUPABASE_URL')}/storage/v1/object/public/imoveis/logo-geum-black.png`;

    // Traduzir role para português
    const roleTranslation: Record<string, string> = {
      'admin': 'Administrador',
      'corretor': 'Corretor'
    };
    const roleDisplay = roleTranslation[role] || role;

    // Template HTML do email
    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite - Geum Imobiliária</title>
        </head>
        <body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif; background-color: #f6f9fc;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 20px 0;">
            <tr>
              <td align="center">
                <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
                  <!-- Header com Logo -->
                  <tr>
                    <td align="center" style="padding: 32px 20px; border-bottom: 1px solid #e6ebf1;">
                      <img src="${logoUrl}" alt="Geum Imobiliária" style="height: 48px; width: auto;" />
                    </td>
                  </tr>
                  
                  <!-- Conteúdo Principal -->
                  <tr>
                    <td style="padding: 32px 20px;">
                      <h1 style="color: #1a1a1a; font-size: 28px; font-weight: bold; margin: 0 0 24px; text-align: center;">
                        🎉 Você foi convidado!
                      </h1>
                      
                      <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Olá <strong>${userName}</strong>,
                      </p>
                      
                      <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Você foi convidado para acessar o sistema GEUM Imobiliária 
                        com a função de <strong>${roleDisplay}</strong>.
                      </p>

                      <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Para começar, clique no botão abaixo e defina sua senha de acesso:
                      </p>

                      <!-- Botão de Definir Senha -->
                      <table width="100%" cellpadding="0" cellspacing="0" style="margin: 32px 0;">
                        <tr>
                          <td align="center">
                            <a href="${setupPasswordUrl}" target="_blank" style="background-color: #0070f3; border-radius: 8px; color: #ffffff; display: inline-block; font-size: 16px; font-weight: bold; text-decoration: none; padding: 14px 32px;">
                              Definir Minha Senha
                            </a>
                          </td>
                        </tr>
                      </table>

                      <p style="color: #525f7f; font-size: 16px; line-height: 24px; margin: 16px 0;">
                        Ou copie e cole este link no seu navegador:
                      </p>
                      
                      <p style="color: #0070f3; font-size: 14px; margin: 16px 0; word-break: break-all;">
                        ${setupPasswordUrl}
                      </p>

                      <div style="background-color: #fff4e6; border-left: 4px solid #ff9800; padding: 16px; margin: 24px 0; border-radius: 4px;">
                        <p style="color: #e65100; font-size: 14px; line-height: 20px; margin: 0; font-weight: 600;">
                          ⏰ Este link de convite expira em 24 horas
                        </p>
                      </div>

                      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 24px 0 8px;">
                        Se você não esperava este convite, por favor ignore este e-mail.
                      </p>
                    </td>
                  </tr>

                  <!-- Footer -->
                  <tr>
                    <td align="center" style="border-top: 1px solid #e6ebf1; padding: 20px;">
                      <p style="color: #8898aa; font-size: 12px; line-height: 16px; margin: 8px 0;">
                        © ${new Date().getFullYear()} Geum Imobiliária. Todos os direitos reservados.
                      </p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;

    console.log('Email template created successfully');

    // Enviar email via Resend API diretamente
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: 'Geum Imobiliária <onboarding@resend.dev>',
        to: [email],
        subject: '🎉 Você foi convidado para o GEUM!',
        html,
      }),
    });

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text();
      console.error('Resend API error:', errorText);
      throw new Error(`Resend API failed: ${resendResponse.status} - ${errorText}`);
    }

    const emailData = await resendResponse.json();
    console.log('Invite email sent successfully:', emailData);

    return new Response(
      JSON.stringify({ success: true, data: emailData }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error('Error in send-invite-email function:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message || 'Failed to send invite email'
      }),
      {
        status: 500,
        headers: { 
          'Content-Type': 'application/json', 
          ...corsHeaders 
        },
      }
    );
  }
};

serve(handler);
