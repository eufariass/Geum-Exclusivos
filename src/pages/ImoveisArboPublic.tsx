import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo } from '@/types';
import { CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Maximize, Home, MapPin, Phone, Mail, ArrowRight, ChevronLeft, ChevronRight, Search, X, ExternalLink } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';
import bannerExclusividade from '@/assets/banner-exclusividade.jpg';
import bannerGeumCast from '@/assets/banner-geumcast.jpg';
import heroSearchBg from '@/assets/hero-search-bg.jpg';
import logoTaroba from '@/assets/logo-taroba.png';
import logoFolha from '@/assets/logo-folha.png';

// --- Components ---

const GlassBadge = ({ children, className = '' }: { children: React.ReactNode, className?: string }) => (
    <span className={`px-3 py-1 bg-white/10 backdrop-blur-md border border-white/20 text-white text-xs font-bold uppercase tracking-wider rounded-lg shadow-lg ${className}`}>
        {children}
    </span>
);

const MediaSection = () => {
    const mediaItems = [
        {
            title: "Geum Imob: a campeã de vendas do Estância Albatroz Residence",
            source: "Folha de Londrina",
            logo: logoFolha,
            link: "https://www.folhadelondrina.com.br/colunistas/ana-maziero/geum-imob-a-campea-de-vendas-do-estancia-albatroz-residence-3276149e.html",
            logoClass: "h-8 md:h-10 brightness-0 opacity-90" // Fix visibility (Force Black)
        },
        {
            title: "Cenas de uma noite especial: Geumland 2026",
            source: "Tarobá News",
            logo: logoTaroba,
            link: "https://taroba.com.br/blog-do-nassif/cenas-de-uma-noite-especial-geumland-2026",
            logoClass: "h-8 md:h-12 brightness-0" // Taroba logo fix if needed
        }
    ];

    return (
        <section className="py-20 bg-muted/20 border-t border-border/40">
            <div className="flex flex-col items-center justify-center mb-12 text-center px-4">
                <h2 className="text-3xl font-bold text-foreground mb-3">Geum na Mídia</h2>
                <p className="text-muted-foreground max-w-2xl text-lg">
                    Confira o que os principais portais de notícias falam sobre a Imobiliária Geum.
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto px-6">
                {mediaItems.map((item, index) => (
                    <a
                        key={index}
                        href={item.link}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group bg-card hover:bg-card/80 border border-border/40 rounded-2xl p-8 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col items-center text-center h-full"
                    >
                        <div className="h-20 w-full flex items-center justify-center mb-6 overflow-hidden bg-muted/10 rounded-xl p-4 group-hover:bg-muted/20 transition-colors">
                            <img
                                src={item.logo}
                                alt={item.source}
                                className={`w-auto object-contain transition-transform duration-500 group-hover:scale-110 ${item.logoClass}`}
                            />
                        </div>
                        <h3 className="text-xl font-bold text-foreground mb-4 line-clamp-2 md:min-h-[3.5rem]">
                            {item.title}
                        </h3>
                        <div className="mt-auto flex items-center gap-2 text-primary font-medium opacity-80 group-hover:opacity-100 transition-opacity">
                            Ler matéria completa <ExternalLink className="h-4 w-4" />
                        </div>
                    </a>
                ))}
            </div>
        </section>
    );
};

const BannerCarousel = () => {
    const banners = [
        {
            image: bannerExclusividade,
            link: '/',
            external: false,
            alt: "Imóveis Exclusivos Geum"
        },
        {
            image: bannerGeumCast,
            link: 'https://www.youtube.com/@geumcast',
            external: true,
            alt: "Geum Cast - Podcast Imobiliário"
        }
    ];

    const [currentIndex, setCurrentIndex] = useState(0);

    // Auto-rotate
    useEffect(() => {
        const interval = setInterval(() => {
            setCurrentIndex((prev) => (prev + 1) % banners.length);
        }, 5000);
        return () => clearInterval(interval);
    }, [banners.length]);

    const nextSlide = (e?: React.MouseEvent) => {
        e?.preventDefault();
        setCurrentIndex((prev) => (prev + 1) % banners.length);
    };

    const prevSlide = (e?: React.MouseEvent) => {
        e?.preventDefault();
        setCurrentIndex((prev) => (prev - 1 + banners.length) % banners.length);
    };

    const currentBanner = banners[currentIndex];
    const LinkComponent = currentBanner.external ? 'a' : Link;
    const linkProps = currentBanner.external
        ? { href: currentBanner.link, target: '_blank', rel: 'noopener noreferrer' }
        : { to: currentBanner.link };

    return (
        <section className="py-12 relative group/banner">
            <LinkComponent {...(linkProps as any)} className="block relative w-full rounded-2xl overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 cursor-pointer">
                <div className="relative h-[250px] md:h-[350px] w-full bg-black">
                    {banners.map((banner, index) => (
                        <div
                            key={index}
                            className={`absolute inset-0 transition-all duration-1000 ease-in-out ${index === currentIndex ? 'opacity-100 scale-100 z-10' : 'opacity-0 scale-105 z-0'
                                }`}
                        >
                            <img
                                src={banner.image}
                                alt={banner.alt}
                                className="w-full h-full object-cover"
                            />
                        </div>
                    ))}

                    {/* Dots Indicators */}
                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-20">
                        {banners.map((_, index) => (
                            <button
                                key={index}
                                onClick={(e) => { e.preventDefault(); setCurrentIndex(index); }}
                                className={`w-2 h-2 rounded-full transition-all duration-300 ${index === currentIndex
                                    ? 'bg-white w-8'
                                    : 'bg-white/50 hover:bg-white/80'
                                    }`}
                                aria-label={`Go to slide ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>
            </LinkComponent>

            {/* Navigation Buttons */}
            <button
                onClick={prevSlide}
                className="absolute left-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all border border-white/10 opacity-0 group-hover/banner:opacity-100 -translate-x-4 group-hover/banner:translate-x-0"
                aria-label="Previous slide"
            >
                <ChevronLeft className="h-6 w-6" />
            </button>
            <button
                onClick={nextSlide}
                className="absolute right-6 top-1/2 -translate-y-1/2 z-30 p-3 rounded-full bg-black/20 backdrop-blur-md text-white hover:bg-black/40 transition-all border border-white/10 opacity-0 group-hover/banner:opacity-100 translate-x-4 group-hover/banner:translate-x-0"
                aria-label="Next slide"
            >
                <ChevronRight className="h-6 w-6" />
            </button>
        </section>
    );
};

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
            <div className="bg-card border border-border/40 rounded-lg overflow-hidden animate-pulse h-full min-w-[280px]">
                <div className="aspect-[4/3] bg-muted" />
                <div className="p-6 space-y-4">
                    <div className="h-5 bg-muted rounded w-3/4" />
                    <div className="h-4 bg-muted rounded w-full" />
                </div>
            </div>
        );
    }

    const image = imovel.primary_image || imovel.images?.[0];
    const isImageLoaded = imagesLoaded?.[imovel.id];

    return (
        <Link to={`/imovel/${imovel.listing_id}`} className="group block h-full min-w-[280px] select-none">
            <article className="h-full bg-card border border-border/40 rounded-2xl overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1 flex flex-col relative">
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

                    {/* Glass Badges */}
                    <div className="absolute top-4 left-4 flex flex-col gap-2 items-start">
                        <GlassBadge className={imovel.transaction_type === 'For Sale' ? 'bg-emerald-500/20 border-emerald-500/30' : 'bg-blue-500/20 border-blue-500/30'}>
                            {imovel.transaction_type === 'For Sale' ? 'Venda' : 'Locação'}
                        </GlassBadge>
                        {imovel.featured && (
                            <GlassBadge className="bg-amber-500/20 border-amber-500/30 text-amber-200">
                                Destaque
                            </GlassBadge>
                        )}
                    </div>

                    {/* Price with Gradient */}
                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/90 via-black/50 to-transparent pt-12">
                        <p className="text-white font-bold text-xl drop-shadow-md">
                            {formatPrice(imovel.price)}
                        </p>
                    </div>
                </div>

                <CardContent className="p-5 flex flex-col flex-grow gap-3">
                    <div className="space-y-1">
                        {imovel.title && (
                            <h2 className="text-base font-bold text-foreground line-clamp-1 group-hover:text-primary transition-colors">{imovel.title}</h2>
                        )}
                        <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                            {imovel.property_type?.replace('Residential / ', '')}
                        </p>
                        <div className="flex items-start gap-1.5 text-muted-foreground">
                            <MapPin className="h-3.5 w-3.5 mt-0.5 flex-shrink-0 text-primary/70" />
                            <p className="text-sm line-clamp-1">
                                {imovel.neighborhood}, {imovel.city}
                            </p>
                        </div>
                    </div>

                    <div className="mt-auto pt-3 border-t border-border/40 flex items-center justify-between text-xs text-muted-foreground font-medium">
                        <div className="flex gap-3">
                            {imovel.bedrooms && (
                                <div className="flex items-center gap-1" title={`${imovel.bedrooms} Quartos`}>
                                    <BedDouble className="h-3.5 w-3.5" />
                                    <span>{imovel.bedrooms}</span>
                                </div>
                            )}
                            {imovel.bathrooms && (
                                <div className="flex items-center gap-1" title={`${imovel.bathrooms} Banheiros`}>
                                    <Bath className="h-3.5 w-3.5" />
                                    <span>{imovel.bathrooms}</span>
                                </div>
                            )}
                            {imovel.living_area && (
                                <div className="flex items-center gap-1" title={`${imovel.living_area}m²`}>
                                    <Maximize className="h-3.5 w-3.5" />
                                    <span>{imovel.living_area}</span>
                                </div>
                            )}
                        </div>
                    </div>
                </CardContent>
            </article>
        </Link>
    );
};

const PropertySection = ({ title, subtitle, imoveis, loading, imagesLoaded, onImageLoad }: {
    title: string,
    subtitle?: string,
    imoveis: ImovelArbo[],
    loading: boolean,
    imagesLoaded: Record<string, boolean>,
    onImageLoad: (id: string) => void
}) => {
    const scrollRef = useRef<HTMLDivElement>(null);

    const scroll = (direction: 'left' | 'right') => {
        if (scrollRef.current) {
            const { current } = scrollRef;
            const scrollAmount = current.clientWidth * 0.8;
            current.scrollBy({ left: direction === 'left' ? -scrollAmount : scrollAmount, behavior: 'smooth' });
        }
    };

    if (!loading && imoveis.length === 0) return null;

    return (
        <section className="py-10 border-b border-border/40 last:border-0 relative group/section">
            <div className="flex items-center justify-between mb-6 px-1">
                <div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground">{title}</h2>
                    {subtitle && <p className="text-muted-foreground mt-1 text-sm md:text-base">{subtitle}</p>}
                </div>

                {/* Navigation Buttons */}
                <div className="flex gap-2">
                    <button
                        onClick={() => scroll('left')}
                        className="p-2 rounded-full border border-border/60 hover:bg-muted hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95"
                        aria-label="Scroll left"
                    >
                        <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                        onClick={() => scroll('right')}
                        className="p-2 rounded-full border border-border/60 hover:bg-muted hover:border-primary/50 text-muted-foreground hover:text-primary transition-all active:scale-95"
                        aria-label="Scroll right"
                    >
                        <ChevronRight className="h-5 w-5" />
                    </button>
                </div>
            </div>

            <div
                ref={scrollRef}
                className="flex gap-6 overflow-x-auto pb-8 -mx-6 px-6 snap-x snap-mandatory scrollbar-hide"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
            >
                {loading ? (
                    [1, 2, 3, 4].map(i => (
                        <div key={i} className="min-w-[280px] md:min-w-[320px] snap-center">
                            <PropertyCard imovel={{} as any} loading={true} />
                        </div>
                    ))
                ) : (
                    imoveis.map(imovel => (
                        <div key={imovel.id} className="min-w-[280px] md:min-w-[320px] snap-center">
                            <PropertyCard
                                imovel={imovel}
                                imagesLoaded={imagesLoaded}
                                onImageLoad={onImageLoad}
                            />
                        </div>
                    ))
                )}
            </div>
        </section>
    );
};

// --- Page ---

const ImoveisArboPublic = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});
    const [searchInput, setSearchInput] = useState(searchQuery);

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

    const handleSearchCheck = (e: React.FormEvent) => {
        e.preventDefault();
        if (searchInput.trim()) {
            setSearchParams({ q: searchInput });
        } else {
            setSearchParams({});
        }
    };

    const clearSearch = () => {
        setSearchInput('');
        setSearchParams({});
    };

    // Filter Logic
    const filteredImoveis = useMemo(() => {
        if (!searchQuery) return imoveis;
        const lowerQ = searchQuery.toLowerCase();
        return imoveis.filter(i =>
            i.title?.toLowerCase().includes(lowerQ) ||
            i.neighborhood?.toLowerCase().includes(lowerQ) ||
            i.city?.toLowerCase().includes(lowerQ) ||
            i.listing_id?.toLowerCase().includes(lowerQ) ||
            i.property_type?.toLowerCase().includes(lowerQ)
        );
    }, [imoveis, searchQuery]);

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

    return (
        <div className="min-h-screen bg-background flex flex-col font-sans">
            {/* Header */}
            <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
                <div className="container mx-auto px-6 py-4 flex items-center justify-between">
                    <Link to="/imoveis" onClick={clearSearch} className="flex items-center gap-2">
                        <img src={logoBlack} alt="Imobiliária Geum" className="h-8 md:h-10 dark:hidden" />
                        <img src={logoWhite} alt="Imobiliária Geum" className="h-8 md:h-10 hidden dark:block" />
                    </Link>

                    <nav className="hidden md:flex items-center gap-8">
                        <a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</a>
                        <Link to="/" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Exclusivos</Link>
                    </nav>
                </div>
            </header>

            <main className="flex-grow container mx-auto px-6 py-8 max-w-7xl">
                {/* Search Hero with Custom Background */}
                <div className="mb-12 relative rounded-2xl bg-black p-16 md:p-24 text-center overflow-hidden min-h-[400px] flex flex-col items-center justify-center">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        <img
                            src={heroSearchBg}
                            alt="Background"
                            className="w-full h-full object-cover opacity-60 transition-transform hover:scale-105 duration-[30s]"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/30" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-4xl mx-auto">
                        <h1 className="text-3xl md:text-5xl font-bold text-white mb-6 drop-shadow-lg tracking-tight">
                            Encontre seu próximo imóvel
                        </h1>
                        <p className="text-white/90 text-lg md:text-xl max-w-2xl mx-auto mb-10 drop-shadow-md font-medium">
                            Milhares de opções em Londrina e região esperando por você.
                        </p>

                        <form onSubmit={handleSearchCheck} className="max-w-2xl mx-auto flex gap-2">
                            <div className="relative flex-grow">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                                <input
                                    type="text"
                                    placeholder="Busque por bairro, cidade, tipo..."
                                    className="w-full h-14 pl-12 pr-4 rounded-xl border-0 bg-white/95 backdrop-blur shadow-xl text-foreground placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/50 transition-all text-lg"
                                    value={searchInput}
                                    onChange={(e) => setSearchInput(e.target.value)}
                                />
                                {searchInput && (
                                    <button type="button" onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary">
                                        <X className="h-5 w-5" />
                                    </button>
                                )}
                            </div>
                            <button type="submit" className="h-14 px-8 bg-primary hover:bg-primary/90 text-primary-foreground font-bold rounded-xl transition-all shadow-xl hover:shadow-2xl active:scale-95">
                                Buscar
                            </button>
                        </form>
                    </div>
                </div>

                {searchQuery ? (
                    /* Search Results View */
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                        <div className="flex items-center justify-between mb-6">
                            <h2 className="text-2xl font-bold">Resultados para "{searchQuery}"</h2>
                            <button onClick={clearSearch} className="text-primary hover:underline text-sm font-medium">Limpar busca</button>
                        </div>
                        {filteredImoveis.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                {filteredImoveis.map(imovel => (
                                    <PropertyCard
                                        key={imovel.id}
                                        imovel={imovel}
                                        imagesLoaded={imagesLoaded}
                                        onImageLoad={handleImageLoad}
                                    />
                                ))}
                            </div>
                        ) : (
                            <div className="text-center py-24 border border-dashed border-border rounded-xl">
                                <Search className="h-12 w-12 text-muted-foreground/20 mx-auto mb-4" />
                                <h3 className="text-lg font-bold text-muted-foreground">Nenhum imóvel encontrado</h3>
                                <p className="text-sm text-muted-foreground/60 mt-1">Tente termos diferentes ou volte para a vitrine.</p>
                                <button onClick={clearSearch} className="mt-4 btn btn-outline">Limpar filtros</button>
                            </div>
                        )}
                    </div>
                ) : (
                    /* Showcase View */
                    <div className="space-y-4 animate-in fade-in duration-700">
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

                        {/* Banner Carousel */}
                        <BannerCarousel />

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

                        {/* Media Section */}
                        <MediaSection />
                    </div>
                )}
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
