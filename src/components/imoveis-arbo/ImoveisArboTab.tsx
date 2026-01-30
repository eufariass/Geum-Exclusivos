import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { usePermissions } from '@/hooks/usePermissions';
import { useToast } from '@/hooks/use-toast';
import { ArboSyncPanel } from './ArboSyncPanel';
import { ImovelArboCard } from './ImovelArboCard';
import { ImovelArboFilters, FiltersState } from './ImovelArboFilters';
import type { ImovelArbo } from '@/types';
import { Building2, RefreshCw, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export function ImoveisArboTab() {
    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [filteredImoveis, setFilteredImoveis] = useState<ImovelArbo[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { isAdmin } = usePermissions();
    const { toast } = useToast();

    const [filters, setFilters] = useState<FiltersState>({
        search: '',
        city: '',
        neighborhood: '',
        transactionType: '',
        minPrice: '',
        maxPrice: '',
        bedrooms: '',
    });

    const loadImoveis = useCallback(async () => {
        setLoading(true);
        setError(null);

        try {
            const { data, error: queryError } = await supabase
                .from('imoveis_arbo')
                .select('*')
                .eq('active', true)
                .order('synced_at', { ascending: false });

            if (queryError) throw queryError;

            setImoveis((data as ImovelArbo[]) || []);
        } catch (err) {
            console.error('Error loading imoveis:', err);
            setError('Erro ao carregar imóveis. Verifique se a tabela foi criada.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        loadImoveis();
    }, [loadImoveis]);

    // Apply filters
    useEffect(() => {
        let result = [...imoveis];

        if (filters.search) {
            const searchLower = filters.search.toLowerCase();
            result = result.filter(
                (i) =>
                    i.title?.toLowerCase().includes(searchLower) ||
                    i.address?.toLowerCase().includes(searchLower) ||
                    i.listing_id?.toLowerCase().includes(searchLower)
            );
        }

        if (filters.city) {
            result = result.filter((i) => i.city === filters.city);
        }

        if (filters.neighborhood) {
            result = result.filter((i) => i.neighborhood === filters.neighborhood);
        }

        if (filters.transactionType) {
            result = result.filter((i) => i.transaction_type === filters.transactionType);
        }

        if (filters.minPrice) {
            result = result.filter((i) => (i.price || 0) >= Number(filters.minPrice));
        }

        if (filters.maxPrice) {
            result = result.filter((i) => (i.price || 0) <= Number(filters.maxPrice));
        }

        if (filters.bedrooms) {
            result = result.filter((i) => (i.bedrooms || 0) >= Number(filters.bedrooms));
        }

        setFilteredImoveis(result);
    }, [imoveis, filters]);

    // Extract unique values for filters
    const cities = [...new Set(imoveis.map((i) => i.city).filter(Boolean))] as string[];
    const neighborhoods = [...new Set(imoveis.map((i) => i.neighborhood).filter(Boolean))] as string[];

    const handleSyncComplete = () => {
        loadImoveis();
        toast({
            title: 'Sincronização concluída',
            description: 'Os imóveis foram atualizados com sucesso.',
        });
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
                        <Building2 className="h-7 w-7" />
                        Vitrine Pública
                    </h1>
                    <p className="text-muted-foreground mt-1">
                        Imóveis sincronizados do CRM Arbo/Superlógica
                    </p>
                </div>

                <div className="flex items-center gap-3">
                    <button
                        onClick={loadImoveis}
                        disabled={loading}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-muted hover:bg-muted/80 transition-colors text-sm font-medium"
                    >
                        <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                        Atualizar
                    </button>

                    {isAdmin && <ArboSyncPanel onSyncComplete={handleSyncComplete} />}
                </div>
            </div>

            {/* Filters */}
            <ImovelArboFilters
                filters={filters}
                onChange={setFilters}
                cities={cities}
                neighborhoods={neighborhoods}
            />

            {/* Stats */}
            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>
                    Exibindo <strong className="text-foreground">{filteredImoveis.length}</strong> de{' '}
                    <strong className="text-foreground">{imoveis.length}</strong> imóveis
                </span>
            </div>

            {/* Error State */}
            {error && (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                    <AlertCircle className="h-12 w-12 text-destructive mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Erro ao carregar imóveis</h3>
                    <p className="text-muted-foreground max-w-md">{error}</p>
                    <button
                        onClick={loadImoveis}
                        className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:opacity-90 transition-opacity"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}

            {/* Loading State */}
            {loading && !error && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[...Array(8)].map((_, i) => (
                        <div
                            key={i}
                            className="bg-card rounded-2xl border border-border overflow-hidden animate-pulse"
                        >
                            <div className="h-48 bg-muted" />
                            <div className="p-4 space-y-3">
                                <div className="h-4 bg-muted rounded w-3/4" />
                                <div className="h-3 bg-muted rounded w-1/2" />
                                <div className="h-6 bg-muted rounded w-1/3 mt-4" />
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty State */}
            {!loading && !error && filteredImoveis.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                    <Building2 className="h-16 w-16 text-muted-foreground/50 mb-4" />
                    <h3 className="font-semibold text-lg mb-2">Nenhum imóvel encontrado</h3>
                    <p className="text-muted-foreground max-w-md">
                        {imoveis.length === 0
                            ? 'Execute uma sincronização para importar os imóveis do Arbo.'
                            : 'Nenhum imóvel corresponde aos filtros aplicados.'}
                    </p>
                </div>
            )}

            {/* Grid */}
            {!loading && !error && filteredImoveis.length > 0 && (
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                >
                    {filteredImoveis.map((imovel, index) => (
                        <motion.div
                            key={imovel.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.05, duration: 0.3 }}
                        >
                            <ImovelArboCard imovel={imovel} />
                        </motion.div>
                    ))}
                </motion.div>
            )}
        </div>
    );
}
