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
    const logoUrl = 'https://polzdhlstwdvzmyxflrk.supabase.co/storage/v1/object/public/imoveis/logo-geum-white.png';

    // Traduzir role para português
    const roleTranslation: Record<string, string> = {
      'admin': 'Administrador',
      'corretor': 'Corretor'
    };
    const roleDisplay = roleTranslation[role] || role;

    // Template HTML do email com design Geum
    const html = `
      <!DOCTYPE html>
      <html lang="pt-BR">
      <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Convite CRM Imobiliária Geum</title>
          <style>
              body { margin: 0; padding: 0; min-width: 100%; background-color: #f4f4f5; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased; }
              .btn-primary {
                  background-color: #000000;
                  color: #ffffff !important;
                  padding: 14px 28px;
                  text-decoration: none;
                  border-radius: 6px;
                  font-weight: bold;
                  display: inline-block;
                  text-align: center;
                  font-size: 16px;
              }
              .btn-primary:hover {
                  background-color: #333333;
              }
          </style>
      </head>
      <body style="margin: 0; padding: 0; background-color: #f4f4f5;">
          <center style="width: 100%; table-layout: fixed; background-color: #f4f4f5; padding: 40px 0;">
              <div style="max-width: 600px; margin: 0 auto; box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);">
                  
                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="background-color: #000000; width: 100%; max-width: 600px; border-radius: 8px 8px 0 0;">
                      <tr>
                          <td align="center" style="padding: 45px 20px;">
                              <img src="${logoUrl}" alt="Imobiliária Geum" style="display: block; border: 0; max-width: 250px; height: auto;">
                          </td>
                      </tr>
                  </table>

                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="background-color: #ffffff; width: 100%; max-width: 600px; border-radius: 0 0 8px 8px;">
                      <tr>
                          <td style="padding: 40px 40px 50px;">
                              <h1 style="margin: 0 0 20px; font-size: 24px; line-height: 30px; color: #111827; font-weight: 700; text-align: center;">
                                  Bem-vindo à Geum
                              </h1>
                              
                              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #4b5563; text-align: center;">
                                  Olá <strong>${userName}</strong>! Sua conta no nosso CRM foi criada com sucesso.
                              </p>
                              
                              <p style="margin: 0 0 20px; font-size: 16px; line-height: 26px; color: #4b5563; text-align: center;">
                                  Você foi convidado com a função de <strong>${roleDisplay}</strong>.
                              </p>
                              
                              <p style="margin: 0 0 35px; font-size: 16px; line-height: 26px; color: #4b5563; text-align: center;">
                                  Para começar a gerenciar seus imóveis e acessar o sistema, clique no botão abaixo e defina sua senha de acesso.
                              </p>

                              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                                  <tr>
                                      <td align="center">
                                          <a href="${setupPasswordUrl}" class="btn-primary">
                                              Confirmar Minha Conta
                                          </a>
                                      </td>
                                  </tr>
                              </table>

                              <p style="margin-top: 40px; margin-bottom: 0; font-size: 14px; line-height: 22px; color: #9ca3af; text-align: center; border-top: 1px solid #e5e7eb; padding-top: 20px;">
                                  Este convite é válido por 24 horas.<br>
                                  Se não foi você, apenas ignore este e-mail.
                              </p>
                          </td>
                      </tr>
                  </table>

                  <table align="center" border="0" cellpadding="0" cellspacing="0" style="width: 100%; max-width: 600px; margin-top: 20px;">
                      <tr>
                          <td align="center" style="padding: 0 20px; font-size: 12px; color: #71717a;">
                              <p>&copy; ${new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.</p>
                          </td>
                      </tr>
                  </table>

              </div>
          </center>
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
