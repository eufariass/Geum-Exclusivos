import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo } from '@/types';
import { CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Maximize, Home, MapPin, Phone, Mail, ArrowRight, Tag, ChevronLeft, ChevronRight } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';
import bannerExclusividade from '@/assets/banner-exclusividade.jpg';

// --- Components ---

const PropertyCard = ({ imovel, loading = false, imagesLoaded, onImageLoad }: { imovel: ImovelArbo, loading?: boolean, imagesLoaded?: Record<string, boolean>, onImageLoad?: (id: string) => void }) => {
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
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden animate-pulse h-full">
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
    }

    const image = imovel.primary_image || imovel.images?.[0];
    const isImageLoaded = imagesLoaded?.[imovel.id];

    return (
        <Link to={`/imovel/${imovel.listing_id}`} className="group block h-full">
            <article className="h-full bg-card border border-border/40 rounded-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {image ? (
                        <>
                            {!isImageLoaded && <div className="absolute inset-0 bg-muted animate-pulse" />}
                            <img
                                src={image}
                                alt={`${imovel.property_type} em ${imovel.neighborhood}`}
                                loading="lazy"
                                onLoad={() => onImageLoad?.(imovel.id)}
                                className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${isImageLoaded ? 'opacity-100' : 'opacity-0'}`}
                            />
                        </>
                    ) : (
                        <div className="w-full h-full flex items-center justify-center bg-muted">
                            <Home className="h-12 w-12 text-muted-foreground/20" />
                        </div>
                    )}

                    {/* Badge */}
                    <div className="absolute top-4 left-4 flex gap-2">
                        <span className={`px-3 py-1 backdrop-blur-md text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm ${imovel.transaction_type === 'For Sale' ? 'bg-green-500/90 text-white' : 'bg-blue-500/90 text-white'
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
    );
};

const PropertySection = ({ title, subtitle, imoveis, loading, imagesLoaded, onImageLoad, onViewAll }: {
    title: string,
    subtitle?: string,
    imoveis: ImovelArbo[],
    loading: boolean,
    imagesLoaded: Record<string, boolean>,
    onImageLoad: (id: string) => void,
    onViewAll?: () => void
}) => {
    if (!loading && imoveis.length === 0) return null;

    return (
        <section className="py-10 border-b border-border/40 last:border-0">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h2 className="text-3xl font-bold text-foreground">{title}</h2>
                    {subtitle && <p className="text-muted-foreground mt-1">{subtitle}</p>}
                </div>
                {onViewAll && (
                    <button
                        onClick={onViewAll}
                        className="text-primary hover:text-primary/80 font-medium flex items-center gap-1 text-sm md:text-base hidden sm:flex"
                    >
                        Ver todos <ChevronRight className="h-4 w-4" />
                    </button>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {loading ? (
                    [1, 2, 3, 4].map(i => <PropertyCard key={i} imovel={{} as any} loading={true} />)
                ) : (
                    imoveis.slice(0, 4).map(imovel => (
                        <PropertyCard
                            key={imovel.id}
                            imovel={imovel}
                            imagesLoaded={imagesLoaded}
                            onImageLoad={onImageLoad}
                        />
                    ))
                )}
            </div>

            {onViewAll && (
                <div className="mt-8 text-center sm:hidden">
                    <button
                        onClick={onViewAll}
                        className="btn btn-outline w-full text-primary border-primary hover:bg-primary hover:text-white transition-colors py-3 rounded-lg font-medium"
                    >
                        Ver todos em {title}
                    </button>
                </div>
            )}
        </section>
    );
};

// --- Page ---

const ImoveisArboPublic = () => {
    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

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

    // Filter Logic
    const featuredImoveis = useMemo(() => imoveis.filter(i => i.featured), [imoveis]);

    const glebaImoveis = useMemo(() => imoveis.filter(i =>
        i.neighborhood?.toLowerCase().includes('gleba') ||
        i.neighborhood?.toLowerCase().includes('palhano')
    ), [imoveis]);

    const condoImoveis = useMemo(() => imoveis.filter(i =>
        i.property_type?.toLowerCase().includes('condo') ||
        i.property_type?.toLowerCase().includes('condomínio') ||
        i.features?.some(f => f.toLowerCase().includes('condomínio'))
    ), [imoveis]);

    const landImoveis = useMemo(() => imoveis.filter(i =>
        i.property_type?.toLowerCase().includes('land') ||
        i.property_type?.toLowerCase().includes('lot') ||
        i.property_type?.toLowerCase().includes('terreno')
    ), [imoveis]);

    const launchImoveis = useMemo(() => imoveis.filter(i =>
        i.publication_type === 'Launch' ||
        i.features?.some(f => f.toLowerCase().includes('lançamento')) ||
        i.property_type?.toLowerCase().includes('development')
    ), [imoveis]);

    if (loading) {
        return (
            <div className="min-h-screen bg-background flex flex-col font-sans">
                <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                    <div className="container mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                    </div>
                </header>
                <main className="flex-grow container mx-auto px-6 py-16 max-w-7xl">
                    <div className="space-y-12">
                        {[1, 2, 3].map(i => (
                            <div key={i} className="space-y-4">
                                <div className="h-8 w-64 bg-muted rounded animate-pulse" />
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                    {[1, 2, 3, 4].map(j => <PropertyCard key={j} imovel={{} as any} loading={true} />)}
                                </div>
                            </div>
                        ))}
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

            <main className="flex-grow container mx-auto px-6 py-12 max-w-7xl">
                {/* Hero / Intro */}
                <div className="mb-12 text-center">
                    <h1 className="text-4xl font-bold text-foreground mb-4">Vitrine de Imóveis</h1>
                    <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                        Explore nossa ampla seleção de imóveis em Londrina e região.
                    </p>
                </div>

                {/* Destaques */}
                <PropertySection
                    title="Destaques"
                    subtitle="Imóveis selecionados para você"
                    imoveis={featuredImoveis}
                    loading={loading}
                    imagesLoaded={imagesLoaded}
                    onImageLoad={handleImageLoad}
                />

                {/* Gleba Palhano */}
                <PropertySection
                    title="Gleba Palhano"
                    subtitle="A região mais valorizada de Londrina"
                    imoveis={glebaImoveis}
                    loading={loading}
                    imagesLoaded={imagesLoaded}
                    onImageLoad={handleImageLoad}
                />

                {/* Banner Exclusivos */}
                <section className="py-12">
                    <Link to="/" className="block relative w-full rounded-2xl overflow-hidden group hover:shadow-2xl transition-all duration-500">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-black/10 transition-colors z-10" />
                        <img
                            src={bannerExclusividade}
                            alt="Veja nossos imóveis exclusivos"
                            className="w-full h-[300px] md:h-[400px] object-cover transform group-hover:scale-105 transition-transform duration-700"
                        />
                        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center text-center p-6">
                            <h2 className="text-3xl md:text-5xl font-bold text-white mb-4 drop-shadow-md">
                                Imóveis Exclusivos Geum
                            </h2>
                            <p className="text-white/90 text-lg md:text-xl max-w-xl mb-8 drop-shadow-sm">
                                Confira nossa seleção premium de imóveis únicos e diferenciados.
                            </p>
                            <span className="px-8 py-3 bg-white text-primary font-bold rounded-full hover:bg-primary hover:text-white transition-all transform hover:scale-105 shadow-lg">
                                Ver Coleção Exclusiva
                            </span>
                        </div>
                    </Link>
                </section>

                {/* Casas em Condomínio */}
                <PropertySection
                    title="Casas em Condomínio"
                    subtitle="Segurança e conforto para sua família"
                    imoveis={condoImoveis}
                    loading={loading}
                    imagesLoaded={imagesLoaded}
                    onImageLoad={handleImageLoad}
                />

                {/* Terrenos */}
                <PropertySection
                    title="Terrenos"
                    subtitle="Construa o sonho da sua vida"
                    imoveis={landImoveis}
                    loading={loading}
                    imagesLoaded={imagesLoaded}
                    onImageLoad={handleImageLoad}
                />

                {/* Lançamentos */}
                <PropertySection
                    title="Lançamentos"
                    subtitle="Novidades e empreendimentos na planta"
                    imoveis={launchImoveis}
                    loading={loading}
                    imagesLoaded={imagesLoaded}
                    onImageLoad={handleImageLoad}
                />

            </main>

            {/* Footer */}
            <footer className="bg-primary text-primary-foreground mt-auto">
                <div className="container mx-auto px-6 py-16 max-w-7xl">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                        <div className="space-y-6">
                            <img src={logoWhite} alt="Imobiliária Geum" className="h-10 opacity-90" />
                            <p className="text-base text-primary-foreground/80">
                                Gente em primeiro lugar. Imobiliária Geum.
                            </p>
                            <p className="text-xs text-primary-foreground/50 font-bold uppercase tracking-widest">
                                CRECI: 7997
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-6 text-white">Navegação</h3>
                            <ul className="space-y-3 text-primary-foreground/80">
                                <li><Link to="/imoveis" className="hover:text-white transition-colors">Imóveis</Link></li>
                                <li><Link to="/" className="hover:text-white transition-colors">Exclusivos</Link></li>
                                <li><a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">Site Institucional</a></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="text-lg font-bold mb-6 text-white">Contato</h3>
                            <div className="space-y-3 text-primary-foreground/80">
                                <p className="flex items-center gap-3">
                                    <MapPin className="h-5 w-5 opacity-70" />
                                    Rua Senador Souza Naves, 2245
                                </p>
                                <p className="flex items-center gap-3">
                                    <Phone className="h-5 w-5 opacity-70" />
                                    (43) 3341-3000
                                </p>
                                <p className="flex items-center gap-3">
                                    <Mail className="h-5 w-5 opacity-70" />
                                    contato@geumimob.com
                                </p>
                            </div>
                        </div>
                    </div>
                    <div className="mt-16 pt-8 border-t border-primary-foreground/10 text-center text-xs text-primary-foreground/40">
                        © {new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
};

export default ImoveisArboPublic;
