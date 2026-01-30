import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo, ArboSyncLog } from '@/types';
import { ImovelArboCard } from './ImovelArboCard';
import { ImovelArboFilters } from './ImovelArboFilters';
import { ArboSyncPanel } from './ArboSyncPanel';
import { Building2, AlertCircle } from 'lucide-react';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { ImovelArboDetailsModal } from './ImovelArboDetailsModal';

export function ImoveisArboTab() {
    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [filteredImoveis, setFilteredImoveis] = useState<ImovelArbo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Modal state
    const [selectedImovel, setSelectedImovel] = useState<ImovelArbo | null>(null);
    const [isDetailsOpen, setIsDetailsOpen] = useState(false);

    const [filters, setFilters] = useState({
        search: '',
        city: '',
        neighborhood: '',
        transactionType: '',
        priceMin: '',
        priceMax: '',
        bedrooms: '',
    });

    const { isAdmin } = usePermissions();
    const { toast } = useToast();

    const loadImoveis = useCallback(async () => {
        try {
            setLoading(true);
            setError(null);
            const { data, error: dbError } = await supabase
                .from('imoveis_arbo')
                .select('*')
                .eq('active', true)
                .order('featured', { ascending: false })
                .order('last_update_date', { ascending: false });

            if (dbError) throw dbError;

            setImoveis((data as ImovelArbo[]) || []);
        } catch (err: any) {
            console.error('Erro ao carregar imóveis Arbo:', err);
            setError('Não foi possível carregar os imóveis. Verifique a conexão ou tente sincronizar novamente.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImoveis();
    }, [loadImoveis]);

    useEffect(() => {
        let result = imoveis;

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(imovel =>
                imovel.title?.toLowerCase().includes(searchLower) ||
                imovel.listing_id.toLowerCase().includes(searchLower) ||
                imovel.property_type?.toLowerCase().includes(searchLower) ||
                imovel.address?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.city) {
            result = result.filter(imovel => imovel.city === filters.city);
        }

        if (filters.neighborhood) {
            result = result.filter(imovel => imovel.neighborhood === filters.neighborhood);
        }

        if (filters.transactionType) {
            result = result.filter(imovel => imovel.transaction_type === filters.transactionType);
        }

        if (filters.priceMin) {
            const min = parseFloat(filters.priceMin);
            result = result.filter(imovel => (imovel.price || 0) >= min);
        }

        if (filters.priceMax) {
            const max = parseFloat(filters.priceMax);
            result = result.filter(imovel => (imovel.price || 0) <= max);
        }

        if (filters.bedrooms) {
            const beds = parseInt(filters.bedrooms);
            result = result.filter(imovel => (imovel.bedrooms || 0) >= beds);
        }

        setFilteredImoveis(result);
    }, [imoveis, filters]);

    const cities = Array.from(new Set(imoveis.map(i => i.city).filter(Boolean) as string[])).sort();
    const neighborhoods = Array.from(new Set(
        imoveis
            .filter(i => !filters.city || i.city === filters.city)
            .map(i => i.neighborhood)
            .filter(Boolean) as string[]
    )).sort();

    const handleSyncComplete = (log: ArboSyncLog) => {
        if (log.status === 'success') {
            toast({
                title: "Sincronização concluída",
                description: `${log.created_count} criados, ${log.updated_count} atualizados.`,
            });
            loadImoveis();
        } else {
            toast({
                variant: "destructive",
                title: "Erro na sincronização",
                description: log.error_message || "Erro desconhecido",
            });
        }
    };

    const handleViewDetails = (imovel: ImovelArbo) => {
        setSelectedImovel(imovel);
        setIsDetailsOpen(true);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-7 w-7" />
                        Vitrine Pública
                    </h1>
                    <p className="text-muted-foreground">
                        Imóveis sincronizados do Arbo/Superlógica
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <button
                        onClick={loadImoveis}
                        className="text-sm font-medium text-primary hover:underline px-3"
                    >
                        Atualizar lista
                    </button>
                    {isAdmin && <ArboSyncPanel onSyncComplete={handleSyncComplete} />}
                </div>
            </div>

            <ImovelArboFilters
                filters={filters}
                onChange={setFilters}
                cities={cities}
                neighborhoods={neighborhoods}
            />

            {error ? (
                <div className="p-8 text-center border border-destructive/20 bg-destructive/5 rounded-xl text-destructive flex flex-col items-center gap-2">
                    <AlertCircle className="h-8 w-8" />
                    <p>{error}</p>
                    <button onClick={loadImoveis} className="text-sm underline font-medium">Tentar novamente</button>
                </div>
            ) : loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="h-[350px] bg-muted animate-pulse rounded-2xl" />
                    ))}
                </div>
            ) : filteredImoveis.length === 0 ? (
                <div className="text-center py-16 text-muted-foreground bg-muted/30 rounded-2xl border border-dashed border-border">
                    <Building2 className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p className="text-lg font-medium">Nenhum imóvel encontrado</p>
                    <p className="text-sm opacity-70">Tente ajustar os filtros ou sincronizar.</p>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredImoveis.map((imovel) => (
                        <ImovelArboCard
                            key={imovel.id}
                            imovel={imovel}
                            onClick={() => handleViewDetails(imovel)}
                        />
                    ))}
                </div>
            )}

            <ImovelArboDetailsModal
                isOpen={isDetailsOpen}
                onClose={() => setIsDetailsOpen(false)}
                imovel={selectedImovel}
            />
        </div>
    );
}
