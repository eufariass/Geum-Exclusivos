import { useState, useEffect } from 'react';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Facebook, Link as LinkIcon, Unlink, AlertCircle, Loader2 } from 'lucide-react';
import { metaAdsService, type MetaAccount, type MetaCampaign } from '@/services/metaAds.service';
import { toast } from 'sonner';

interface MetaAdsCampaignSelectorProps {
  imovelId?: string;
  onCampaignLinked?: () => void;
}

interface AvailableCampaign {
  id: string;
  name: string;
  status: string;
  objective: string;
}

export const MetaAdsCampaignSelector = ({ imovelId, onCampaignLinked }: MetaAdsCampaignSelectorProps) => {
  const [accounts, setAccounts] = useState<MetaAccount[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<string>('');
  const [availableCampaigns, setAvailableCampaigns] = useState<AvailableCampaign[]>([]);
  const [selectedCampaign, setSelectedCampaign] = useState<string>('');
  const [linkedCampaign, setLinkedCampaign] = useState<MetaCampaign | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingCampaigns, setLoadingCampaigns] = useState(false);
  const [linking, setLinking] = useState(false);

  useEffect(() => {
    loadAccounts();
    if (imovelId) {
      loadLinkedCampaign();
    }
  }, [imovelId]);

  const loadAccounts = async () => {
    try {
      const data = await metaAdsService.getMetaAccounts();
      setAccounts(data);
    } catch (error) {
      console.error('Error loading accounts:', error);
    }
  };

  const loadLinkedCampaign = async () => {
    if (!imovelId) return;

    try {
      const campaigns = await metaAdsService.getCampaignsByImovel(imovelId);
      if (campaigns.length > 0) {
        setLinkedCampaign(campaigns[0]); // Assume one campaign per property for now
      }
    } catch (error) {
      console.error('Error loading linked campaign:', error);
    }
  };

  const loadCampaigns = async (accountId: string) => {
    setLoadingCampaigns(true);
    try {
      const account = accounts.find(a => a.id === accountId);
      if (!account) return;

      // Fetch campaigns from Meta API
      const response = await fetch(
        `https://graph.facebook.com/v18.0/${account.account_id}/campaigns?` +
        `fields=id,name,status,objective,effective_status` +
        `&access_token=${account.access_token}`
      );

      if (!response.ok) {
        throw new Error('Failed to fetch campaigns');
      }

      const data = await response.json();
      setAvailableCampaigns(data.data || []);
    } catch (error) {
      console.error('Error loading campaigns:', error);
      toast.error('Erro ao carregar campanhas. Verifique se a conta está conectada corretamente.');
      setAvailableCampaigns([]);
    } finally {
      setLoadingCampaigns(false);
    }
  };

  const handleAccountChange = (accountId: string) => {
    setSelectedAccount(accountId);
    setSelectedCampaign('');
    setAvailableCampaigns([]);
    if (accountId) {
      loadCampaigns(accountId);
    }
  };

  const handleLinkCampaign = async () => {
    if (!imovelId || !selectedAccount || !selectedCampaign) {
      toast.error('Selecione uma conta e uma campanha');
      return;
    }

    setLinking(true);
    try {
      const account = accounts.find(a => a.id === selectedAccount);
      const campaign = availableCampaigns.find(c => c.id === selectedCampaign);

      if (!account || !campaign) {
        throw new Error('Account or campaign not found');
      }

      await metaAdsService.linkCampaignToImovel(
        imovelId,
        selectedAccount,
        campaign.id,
        campaign.name,
        account.account_id,
        campaign.status,
        campaign.objective
      );

      toast.success('Campanha vinculada com sucesso!');
      await loadLinkedCampaign();
      setSelectedAccount('');
      setSelectedCampaign('');
      setAvailableCampaigns([]);
      onCampaignLinked?.();
    } catch (error) {
      console.error('Error linking campaign:', error);
      toast.error('Erro ao vincular campanha');
    } finally {
      setLinking(false);
    }
  };

  const handleUnlinkCampaign = async () => {
    if (!linkedCampaign) return;

    if (!confirm('Tem certeza que deseja desvincular esta campanha?')) {
      return;
    }

    try {
      await metaAdsService.unlinkCampaign(linkedCampaign.id);
      toast.success('Campanha desvinculada');
      setLinkedCampaign(null);
      onCampaignLinked?.();
    } catch (error) {
      console.error('Error unlinking campaign:', error);
      toast.error('Erro ao desvincular campanha');
    }
  };

  if (accounts.length === 0) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription className="text-sm">
          Nenhuma conta Meta Ads conectada.
          Vá em <strong>Meta Ads</strong> e conecte sua conta do Facebook Business primeiro.
        </AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      {linkedCampaign ? (
        // Show linked campaign
        <div className="border rounded-lg p-4 bg-muted/30">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center flex-shrink-0">
                <Facebook className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <p className="font-medium flex items-center gap-2">
                  {linkedCampaign.campaign_name}
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                    linkedCampaign.status === 'ACTIVE'
                      ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                  }`}>
                    {linkedCampaign.status || 'N/A'}
                  </span>
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  ID: {linkedCampaign.campaign_id}
                </p>
                {linkedCampaign.objective && (
                  <p className="text-xs text-muted-foreground mt-1">
                    Objetivo: {linkedCampaign.objective}
                  </p>
                )}
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleUnlinkCampaign}
              className="gap-2"
            >
              <Unlink className="h-4 w-4" />
              Desvincular
            </Button>
          </div>
        </div>
      ) : (
        // Show campaign selector
        <>
          <div>
            <Label>Conta Meta Ads</Label>
            <Select value={selectedAccount} onValueChange={handleAccountChange}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma conta" />
              </SelectTrigger>
              <SelectContent>
                {accounts.map((account) => (
                  <SelectItem key={account.id} value={account.id}>
                    {account.account_name || `Conta ${account.account_id}`}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedAccount && (
            <div>
              <Label>Campanha</Label>
              {loadingCampaigns ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
                </div>
              ) : availableCampaigns.length === 0 ? (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription className="text-sm">
                    Nenhuma campanha encontrada nesta conta.
                  </AlertDescription>
                </Alert>
              ) : (
                <Select value={selectedCampaign} onValueChange={setSelectedCampaign}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma campanha" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCampaigns.map((campaign) => (
                      <SelectItem key={campaign.id} value={campaign.id}>
                        {campaign.name} ({campaign.status})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            </div>
          )}

          {selectedCampaign && (
            <Button
              onClick={handleLinkCampaign}
              disabled={linking || !imovelId}
              className="w-full gap-2"
            >
              {linking ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Vinculando...
                </>
              ) : (
                <>
                  <LinkIcon className="h-4 w-4" />
                  Vincular Campanha
                </>
              )}
            </Button>
          )}
        </>
      )}

      <p className="text-xs text-muted-foreground">
        As métricas desta campanha serão sincronizadas automaticamente e
        estarão disponíveis em <strong>Meta Ads &gt; Relatórios</strong>.
      </p>
    </div>
  );
};
