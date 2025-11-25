import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Facebook, Check, AlertCircle, Loader2, Unplug } from 'lucide-react';
import { metaAdsService, type MetaAccount } from '@/services/metaAds.service';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

const FACEBOOK_APP_ID = import.meta.env.VITE_FACEBOOK_APP_ID;
const REDIRECT_URI = `${window.location.origin}/sistema`;

export const MetaAdsConnect = () => {
  const { user } = useAuth();
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    loadAccounts();
  }, []);

  const loadAccounts = async () => {
    try {
      setLoading(true);
      const data = await metaAdsService.getMetaAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
      toast.error('Erro ao carregar contas conectadas');
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = () => {
    if (!FACEBOOK_APP_ID) {
      toast.error('Facebook App ID não configurado');
      return;
    }

    setConnecting(true);

    const scope = [
      'ads_read',
      'ads_management',
      'business_management',
      'leads_retrieval'
    ].join(',');

    const authUrl = `https://www.facebook.com/v18.0/dialog/oauth?` +
      `client_id=${FACEBOOK_APP_ID}` +
      `&redirect_uri=${encodeURIComponent(REDIRECT_URI)}` +
      `&scope=${encodeURIComponent(scope)}` +
      `&response_type=code` +
      `&state=meta_ads_connect`;

    // Open in new window
    const width = 600;
    const height = 700;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;

    const popup = window.open(
      authUrl,
      'Facebook Login',
      `width=${width},height=${height},left=${left},top=${top}`
    );

    // Listen for messages from popup
    const messageHandler = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;

      if (event.data.type === 'META_ADS_AUTH_SUCCESS') {
        window.removeEventListener('message', messageHandler);
        popup?.close();

        toast.success('Conta conectada com sucesso!');
        await loadAccounts();
        setConnecting(false);
      } else if (event.data.type === 'META_ADS_AUTH_ERROR') {
        window.removeEventListener('message', messageHandler);
        popup?.close();

        toast.error('Erro ao conectar conta');
        setConnecting(false);
      }
    };

    window.addEventListener('message', messageHandler);

    // Check if popup was closed
    const checkClosed = setInterval(() => {
      if (popup?.closed) {
        clearInterval(checkClosed);
        window.removeEventListener('message', messageHandler);
        setConnecting(false);
      }
    }, 1000);
  };

  const handleDisconnect = async (accountId: string) => {
    if (!confirm('Tem certeza que deseja desconectar esta conta? As campanhas vinculadas não serão mais atualizadas.')) {
      return;
    }

    try {
      await metaAdsService.deleteMetaAccount(accountId);
      toast.success('Conta desconectada');
      await loadAccounts();
    } catch (error) {
      console.error('Error disconnecting account:', error);
      toast.error('Erro ao desconectar conta');
    }
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Facebook className="h-5 w-5 text-blue-600" />
            Conexão com Meta Ads
          </CardTitle>
          <CardDescription>
            Conecte sua conta do Facebook Business para rastrear automaticamente
            as métricas das campanhas dos imóveis
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {accounts.length === 0 ? (
            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Nenhuma conta conectada. Conecte sua conta do Facebook Business para começar.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="space-y-3">
              {accounts.map((account) => (
                <div
                  key={account.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                      <Facebook className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">
                        {account.account_name || `Conta ${account.account_id}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ID: {account.account_id}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 text-sm text-green-600">
                      <Check className="h-4 w-4" />
                      Conectada
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDisconnect(account.id)}
                    >
                      <Unplug className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}

          <Button
            onClick={handleConnect}
            disabled={connecting}
            className="w-full gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Conectando...
              </>
            ) : (
              <>
                <Facebook className="h-4 w-4" />
                {accounts.length > 0 ? 'Conectar Outra Conta' : 'Conectar com Facebook'}
              </>
            )}
          </Button>

          <div className="text-xs text-muted-foreground space-y-1">
            <p><strong>Permissões necessárias:</strong></p>
            <ul className="list-disc list-inside ml-2 space-y-0.5">
              <li>Leitura de anúncios (ads_read)</li>
              <li>Gerenciamento de anúncios (ads_management)</li>
              <li>Gerenciamento de negócios (business_management)</li>
              <li>Captura de leads (leads_retrieval)</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
