import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  TrendingUp,
  Eye,
  MousePointer,
  DollarSign,
  Users,
  RefreshCcw,
  Calendar
} from 'lucide-react';
import { MetaAdsConnect } from './MetaAdsConnect';
import { metaAdsService } from '@/services/metaAds.service';
import { toast } from 'sonner';
import { Skeleton } from '@/components/ui/skeleton';

export const MetaAdsReportsTab = () => {
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [aggregatedMetrics, setAggregatedMetrics] = useState<any>(null);
  const [campaigns, setCampaigns] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [accountsData, campaignsData, metricsData] = await Promise.all([
        metaAdsService.getMetaAccounts(),
        metaAdsService.getMetaCampaigns(),
        metaAdsService.getAggregatedMetrics(
          new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        )
      ]);

      setAccounts(accountsData);
      setCampaigns(campaignsData);
      setAggregatedMetrics(metricsData);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Erro ao carregar dados');
    } finally {
      setLoading(false);
    }
  };

  const handleSync = async () => {
    if (accounts.length === 0) {
      toast.error('Nenhuma conta conectada');
      return;
    }

    setSyncing(true);
    try {
      // Sync each account
      for (const account of accounts) {
        await metaAdsService.syncMetrics(account.id);
      }
      toast.success('Sincronização iniciada! Os dados serão atualizados em breve.');

      // Reload data after a short delay
      setTimeout(() => {
        loadData();
      }, 2000);
    } catch (error) {
      console.error('Error syncing:', error);
      toast.error('Erro ao sincronizar dados');
    } finally {
      setSyncing(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatNumber = (value: number) => {
    return new Intl.NumberFormat('pt-BR').format(value);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-3">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Relatórios dos Anúncios</h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe as métricas das campanhas do Meta Ads
          </p>
        </div>
        <Button onClick={handleSync} disabled={syncing} className="gap-2">
          <RefreshCcw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Sincronizando...' : 'Sincronizar'}
        </Button>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <TabsList>
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="campaigns">Campanhas</TabsTrigger>
          <TabsTrigger value="connection">Conexão</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* KPI Cards */}
          {aggregatedMetrics && (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Investimento Total
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatCurrency(aggregatedMetrics.totalSpend)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Últimos 30 dias
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Eye className="h-4 w-4" />
                    Impressões
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(aggregatedMetrics.totalImpressions)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Visualizações dos anúncios
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <MousePointer className="h-4 w-4" />
                    Cliques
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(aggregatedMetrics.totalClicks)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    CTR: {aggregatedMetrics.averageCTR.toFixed(2)}%
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Leads
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {formatNumber(aggregatedMetrics.totalLeads)}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    CPC: {formatCurrency(aggregatedMetrics.averageCPC)}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <TrendingUp className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-lg font-medium mb-2">Nenhuma campanha vinculada</p>
                <p className="text-muted-foreground mb-4">
                  Conecte sua conta e vincule campanhas aos imóveis para começar
                </p>
                <Button onClick={() => document.querySelector('[value="connection"]')?.click()}>
                  Conectar Conta
                </Button>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Campanhas Ativas</CardTitle>
                <CardDescription>
                  {campaigns.length} campanha{campaigns.length !== 1 ? 's' : ''} vinculada{campaigns.length !== 1 ? 's' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {campaigns.map((campaign) => (
                    <div
                      key={campaign.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{campaign.campaign_name}</p>
                        <p className="text-sm text-muted-foreground">
                          ID: {campaign.campaign_id}
                        </p>
                      </div>
                      <div className="text-right">
                        <div className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          campaign.status === 'ACTIVE'
                            ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
                        }`}>
                          {campaign.status || 'N/A'}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="campaigns">
          <Card>
            <CardHeader>
              <CardTitle>Gerenciar Campanhas</CardTitle>
              <CardDescription>
                Vincule campanhas do Meta Ads aos imóveis
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">
                Esta funcionalidade estará disponível na aba de cada imóvel.
                Acesse a aba "Imóveis" e edite um imóvel para vincular uma campanha.
              </p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="connection">
          <MetaAdsConnect />
        </TabsContent>
      </Tabs>
    </div>
  );
};
