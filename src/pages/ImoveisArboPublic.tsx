import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo } from '@/types';
import { CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Maximize, Home, MapPin, Phone, Mail, ArrowRight, Search, X, SlidersHorizontal, Tag } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const PropertySkeleton = () => (
    <div className="bg-card border border-border/40 rounded-lg overflow-hidden animate-pulse">
        <div className="aspect-[4/3] bg-muted" />
        <div className="p-6 space-y-4">
            <div className="h-5 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-full" />
            <div className="pt-4 border-t border-border/40 flex gap-4">
                <div className="h-4 bg-muted rounded w-12" />
                <div className="h-4 bg-muted rounded w-12" />
                <div className="h-4 bg-muted rounded w-12" />
            </div>
        </div>
    </div>
);

const ImoveisArboPublic = () => {
    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

    const [appliedFilters, setAppliedFilters] = useState({
        searchTerm: '',
        transactionType: '' as '' | 'For Sale' | 'For Rent',
        city: '',
        neighborhood: '',
        priceMin: '',
        priceMax: '',
        bedrooms: '',
    });

    const [pendingFilters, setPendingFilters] = useState({
        transactionType: '' as '' | 'For Sale' | 'For Rent',
        city: '',
        neighborhood: '',
        priceMin: '',
        priceMax: '',
        bedrooms: '',
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);

    const handleImageLoad = useCallback((id: string) => {
        setImagesLoaded(prev => ({ ...prev, [id]: true }));
    }, []);

    useEffect(() => {
        const loadImoveis = async () => {
            try {
                const { data, error } = await supabase
                    .from('imoveis_arbo')
                    .select('*')
                    .eq('active', true)
                    .order('featured', { ascending: false })
                    .order('last_update_date', { ascending: false });

                if (error) throw error;
                setImoveis((data as ImovelArbo[]) || []);
            } catch (error) {
                console.error('Erro ao carregar imóveis:', error);
            } finally {
                setLoading(false);
            }
        };

        loadImoveis();
    }, []);

    const cities = useMemo(() => {
        const set = new Set<string>();
        imoveis.forEach(i => i.city && set.add(i.city));
        return Array.from(set).sort();
    }, [imoveis]);

    const neighborhoods = useMemo(() => {
        const set = new Set<string>();
        imoveis.forEach(i => {
            if ((!appliedFilters.city || i.city === appliedFilters.city) && i.neighborhood) {
                set.add(i.neighborhood);
            }
        });
        return Array.from(set).sort();
    }, [imoveis, appliedFilters.city]);

    const filteredImoveis = useMemo(() => {
        return imoveis.filter((imovel) => {
            if (appliedFilters.searchTerm) {
                const search = appliedFilters.searchTerm.toLowerCase();
                const matches =
                    imovel.title?.toLowerCase().includes(search) ||
                    imovel.address?.toLowerCase().includes(search) ||
                    imovel.listing_id?.toLowerCase().includes(search) ||
                    imovel.neighborhood?.toLowerCase().includes(search) ||
                    imovel.city?.toLowerCase().includes(search);
                if (!matches) return false;
            }

            if (appliedFilters.transactionType && imovel.transaction_type !== appliedFilters.transactionType) {
                return false;
            }

            if (appliedFilters.city && imovel.city !== appliedFilters.city) {
                return false;
            }

            if (appliedFilters.neighborhood && imovel.neighborhood !== appliedFilters.neighborhood) {
                return false;
            }

            if (appliedFilters.priceMin) {
                const minPrice = parseFloat(appliedFilters.priceMin);
                if (imovel.price && imovel.price < minPrice) return false;
            }

            if (appliedFilters.priceMax) {
                const maxPrice = parseFloat(appliedFilters.priceMax);
                if (imovel.price && imovel.price > maxPrice) return false;
            }

            if (appliedFilters.bedrooms) {
                const beds = parseInt(appliedFilters.bedrooms);
                if (!imovel.bedrooms || imovel.bedrooms < beds) return false;
            }

            return true;
        });
    }, [imoveis, appliedFilters]);

    const hasActiveFilters = appliedFilters.searchTerm || appliedFilters.transactionType || appliedFilters.city || appliedFilters.neighborhood || appliedFilters.priceMin || appliedFilters.priceMax || appliedFilters.bedrooms;

    const applyFilters = () => {
        setAppliedFilters(prev => ({
            ...prev,
            ...pendingFilters,
        }));
        setShowFilters(false);
    };

    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setAppliedFilters(prev => ({ ...prev, searchTerm: value }));
    };

    const clearFilters = () => {
        setSearchTerm('');
        setPendingFilters({ transactionType: '', city: '', neighborhood: '', priceMin: '', priceMax: '', bedrooms: '' });
        setAppliedFilters({ searchTerm: '', transactionType: '', city: '', neighborhood: '', priceMin: '', priceMax: '', bedrooms: '' });
    };

    const handleToggleFilters = () => {
        if (!showFilters) {
            setPendingFilters({
                transactionType: appliedFilters.transactionType,
                city: appliedFilters.city,
                neighborhood: appliedFilters.neighborhood,
                priceMin: appliedFilters.priceMin,
                priceMax: appliedFilters.priceMax,
                bedrooms: appliedFilters.bedrooms,
            });
        }
        setShowFilters(!showFilters);
    };

    useEffect(() => {
        document.title = 'Imóveis à Venda e Locação | Imobiliária Geum';
    }, []);

    const formatPrice = (price?: number) => {
        if (!price) return 'Sob consulta';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col font-sans">
                <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                    </div>
                </header>
                <main className="flex-grow container mx-auto px-6 py-16 max-w-7xl">
                    <div className="mb-12">
                        <div className="h-12 bg-muted rounded-lg animate-pulse" />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {[1, 2, 3, 4, 5, 6].map(i => <PropertySkeleton key={i} />)}
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-5 flex items-center justify-between">
                    <Link to="/imoveis" className="flex items-center gap-2">
                        <img src={logoBlack} alt="Imobiliária Geum" className="h-10 dark:hidden" />
                        <img src={logoWhite} alt="Imobiliária Geum" className="h-10 hidden dark:block" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</a>
                        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Exclusivos</Link>
                        <a href="https://wa.link/sgqkpd" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contato</a>
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-6 py-16 max-w-7xl">
                {/* Hero */}
                <div className="mb-10 text-center">
                    <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                        Encontre seu imóvel ideal
                    </h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Explore nossa seleção de imóveis à venda e para locação.
                    </p>
                </div>

                {/* Filters */}
                <div className="mb-12 space-y-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Buscar por nome, endereço, cidade ou código..."
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                className="w-full h-12 pl-12 pr-4 bg-card border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                            />
                            {searchTerm && (
                                <button onClick={() => handleSearch('')} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                                    <X className="h-4 w-4" />
                                </button>
                            )}
                        </div>
                        <button
                            onClick={handleToggleFilters}
                            className={`h-12 px-5 flex items-center gap-2 border rounded-lg text-sm font-medium transition-all ${showFilters || hasActiveFilters
                                    ? 'bg-primary text-primary-foreground border-primary'
                                    : 'bg-card border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
                                }`}
                        >
                            <SlidersHorizontal className="h-4 w-4" />
                            <span className="hidden sm:inline">Filtros</span>
                        </button>
                    </div>

                    {/* Expandable Filters */}
                    <div className={`grid gap-4 overflow-hidden transition-all duration-300 ${showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}>
                        <div className="overflow-hidden">
                            <div className="bg-card border border-border/60 rounded-lg p-5">
                                {/* Transaction Type */}
                                <div className="space-y-3 mb-5">
                                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tipo de Negócio</label>
                                    <div className="flex gap-2">
                                        {(['', 'For Sale', 'For Rent'] as const).map(type => (
                                            <button
                                                key={type || 'all'}
                                                onClick={() => setPendingFilters(p => ({ ...p, transactionType: type }))}
                                                className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${pendingFilters.transactionType === type
                                                        ? 'bg-primary text-primary-foreground border-primary'
                                                        : 'bg-background border-border/60 text-muted-foreground hover:border-primary'
                                                    }`}
                                            >
                                                {type === '' ? 'Todos' : type === 'For Sale' ? 'Venda' : 'Locação'}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                                    {/* City */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cidade</label>
                                        <select
                                            value={pendingFilters.city}
                                            onChange={(e) => setPendingFilters(p => ({ ...p, city: e.target.value, neighborhood: '' }))}
                                            className="w-full h-11 px-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Todas</option>
                                            {cities.map(c => <option key={c} value={c}>{c}</option>)}
                                        </select>
                                    </div>

                                    {/* Neighborhood */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Bairro</label>
                                        <select
                                            value={pendingFilters.neighborhood}
                                            onChange={(e) => setPendingFilters(p => ({ ...p, neighborhood: e.target.value }))}
                                            className="w-full h-11 px-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Todos</option>
                                            {neighborhoods.map(n => <option key={n} value={n}>{n}</option>)}
                                        </select>
                                    </div>

                                    {/* Price Min */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço Mín</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                            <input
                                                type="text"
                                                placeholder="0"
                                                value={pendingFilters.priceMin}
                                                onChange={(e) => setPendingFilters(p => ({ ...p, priceMin: e.target.value.replace(/\D/g, '') }))}
                                                className="w-full h-11 pl-10 pr-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Price Max */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço Máx</label>
                                        <div className="relative">
                                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                                            <input
                                                type="text"
                                                placeholder="Sem limite"
                                                value={pendingFilters.priceMax}
                                                onChange={(e) => setPendingFilters(p => ({ ...p, priceMax: e.target.value.replace(/\D/g, '') }))}
                                                className="w-full h-11 pl-10 pr-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                            />
                                        </div>
                                    </div>

                                    {/* Bedrooms */}
                                    <div className="space-y-2">
                                        <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quartos (mín)</label>
                                        <select
                                            value={pendingFilters.bedrooms}
                                            onChange={(e) => setPendingFilters(p => ({ ...p, bedrooms: e.target.value }))}
                                            className="w-full h-11 px-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20"
                                        >
                                            <option value="">Qualquer</option>
                                            {[1, 2, 3, 4, 5].map(n => <option key={n} value={n}>{n}+</option>)}
                                        </select>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-5 pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between gap-3">
                                    <button onClick={clearFilters} className="text-sm font-medium text-muted-foreground hover:text-primary flex items-center gap-1.5">
                                        <X className="h-4 w-4" />
                                        Limpar filtros
                                    </button>
                                    <button onClick={applyFilters} className="h-11 px-6 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors">
                                        Aplicar Filtros
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Results Count */}
                    <div className="flex items-center justify-end">
                        <span className="text-sm text-muted-foreground">
                            {filteredImoveis.length} {filteredImoveis.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
                        </span>
                    </div>
                </div>

                {/* Grid */}
                {filteredImoveis.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/50">
                        <Home className="h-16 w-16 text-muted-foreground/20 mb-6" />
                        <h2 className="text-2xl font-bold text-primary mb-2">
                            {hasActiveFilters ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel disponível'}
                        </h2>
                        <p className="text-muted-foreground">
                            {hasActiveFilters ? 'Tente ajustar os filtros.' : 'Em breve teremos novidades.'}
                        </p>
                        {hasActiveFilters && (
                            <button onClick={clearFilters} className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90">
                                Limpar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                        {filteredImoveis.map((imovel) => (
                            <Link
                                key={imovel.id}
                                to={`/imovel/${imovel.listing_id}`}
                                className="group block h-full"
                            >
                                <article className="h-full bg-card border border-border/40 rounded-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                                    <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                                        {imovel.primary_image || (imovel.images && imovel.images.length > 0) ? (
                                            <>
                                                {!imagesLoaded[imovel.id] && (
                                                    <div className="absolute inset-0 bg-muted animate-pulse" />
                                                )}
                                                <img
                                                    src={imovel.primary_image || imovel.images?.[0]}
                                                    alt={`${imovel.property_type} em ${imovel.neighborhood}, ${imovel.city}`}
                                                    loading="lazy"
                                                    onLoad={() => handleImageLoad(imovel.id)}
                                                    className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${imagesLoaded[imovel.id] ? 'opacity-100' : 'opacity-0'
                                                        }`}
                                                />
                                            </>
                                        ) : (
                                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                                <Home className="h-12 w-12 text-muted-foreground/20" />
                                            </div>
                                        )}

                                        {/* Transaction Badge */}
                                        <div className="absolute top-4 left-4 flex gap-2">
                                            <span className={`px-3 py-1 backdrop-blur-md text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm ${imovel.transaction_type === 'For Sale'
                                                    ? 'bg-green-500/90 text-white'
                                                    : 'bg-blue-500/90 text-white'
                                                }`}>
                                                {imovel.transaction_type === 'For Sale' ? 'Venda' : 'Locação'}
                                            </span>
                                            {imovel.featured && (
                                                <span className="px-3 py-1 bg-amber-500/90 backdrop-blur-md text-white text-xs font-bold uppercase rounded-sm">
                                                    Destaque
                                                </span>
                                            )}
                                        </div>

                                        {/* Price */}
                                        <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
                                            <p className="text-white font-bold text-xl md:text-2xl">
                                                {formatPrice(imovel.price)}
                                            </p>
                                        </div>
                                    </div>

                                    <CardContent className="p-6 flex flex-col flex-grow gap-4">
                                        <div className="space-y-2">
                                            {imovel.title && (
                                                <h2 className="text-lg font-bold text-primary line-clamp-1">{imovel.title}</h2>
                                            )}
                                            <p className="text-sm text-muted-foreground font-medium">
                                                {imovel.property_type?.replace('Residential / ', '')}
                                            </p>
                                            <div className="flex items-start gap-2 text-muted-foreground">
                                                <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary/60" />
                                                <p className="text-sm font-medium line-clamp-2">
                                                    {imovel.neighborhood}, {imovel.city}
                                                </p>
                                            </div>
                                        </div>

                                        <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground">
                                            <div className="flex gap-4">
                                                {imovel.bedrooms && (
                                                    <div className="flex items-center gap-1.5" title={`${imovel.bedrooms} Quartos`}>
                                                        <BedDouble className="h-4 w-4" />
                                                        <span>{imovel.bedrooms}</span>
                                                    </div>
                                                )}
                                                {imovel.bathrooms && (
                                                    <div className="flex items-center gap-1.5" title={`${imovel.bathrooms} Banheiros`}>
                                                        <Bath className="h-4 w-4" />
                                                        <span>{imovel.bathrooms}</span>
                                                    </div>
                                                )}
                                                {imovel.living_area && (
                                                    <div className="flex items-center gap-1.5" title={`${imovel.living_area}m²`}>
                                                        <Maximize className="h-4 w-4" />
                                                        <span>{imovel.living_area}</span>
                                                    </div>
                                                )}
                                            </div>
                                            <ArrowRight className="h-5 w-5 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                                        </div>
                                    </CardContent>
                                </article>
                            </Link>
                        ))}
                    </div>
                )}
            </main>

            {/* Footer */}
            <footer className="bg-primary text-primary-foreground mt-auto">
                <div className="container mx-auto px-6 py-16 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <img src={logoWhite} alt="Imobiliária Geum" className="h-10 opacity-90" />
                            <p className="text-primary-foreground/60 text-sm">
                                Gente em primeiro lugar. Imobiliária Geum.
                            </p>
                            <p className="text-xs text-primary-foreground/40 font-bold tracking-widest uppercase">
                                CRECI: 7997
                            </p>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-6 text-white">Navegação</h3>
                            <ul className="space-y-4 text-sm text-primary-foreground/70">
                                <li><Link to="/imoveis" className="hover:text-white transition-colors">Imóveis</Link></li>
                                <li><Link to="/" className="hover:text-white transition-colors">Exclusivos</Link></li>
                                <li><a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Site Principal</a></li>
                            </ul>
                        </div>

                        <div>
                            <h3 className="text-lg font-bold mb-6 text-white">Contato</h3>
                            <div className="space-y-4 text-sm text-primary-foreground/70">
                                <p className="flex items-start gap-3">
                                    <MapPin className="h-5 w-5 text-white/80 flex-shrink-0" />
                                    <span>Rua Senador Souza Naves, 2245<br />Londrina, Paraná</span>
                                </p>
                                <p className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 text-white/80 flex-shrink-0" />
                                    <a href="tel:+554333413000" className="hover:text-white">(43) 3341-3000</a>
                                </p>
                                <p className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 text-white/80 flex-shrink-0" />
                                    <a href="mailto:contato@geumimob.com" className="hover:text-white">contato@geumimob.com</a>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/40">
                        <p>© {new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.</p>
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ImoveisArboPublic;
