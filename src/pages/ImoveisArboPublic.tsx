import { useEffect, useState, useMemo, useCallback, useRef } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo } from '@/types';
import { cmsService, SiteBanner } from '@/services/cms.service';
import { CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Maximize, Home, MapPin, Phone, Mail, ArrowRight, ChevronLeft, ChevronRight, Search, X, ExternalLink } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';
import bannerExclusividade from '@/assets/banner-exclusividade.jpg';
import bannerGeumCast from '@/assets/banner-geumcast.jpg';
import heroSearchBg from '@/assets/londrina-hero.jpg';
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
            logoClass: "h-8 md:h-10 opacity-100 mix-blend-multiply filter contrast-[2] brightness-[0.2]" // Stronger Contrast Force
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

const BannerCarousel = ({ banners }: { banners: SiteBanner[] }) => {
    // If no banners provided, return null or fallback
    if (!banners || banners.length === 0) return null;

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

    // Safety check
    if (!currentBanner) return null;

    const LinkComponent = currentBanner.external_link ? 'a' : Link;
    const linkProps = currentBanner.external_link
        ? { href: currentBanner.link_url, target: '_blank', rel: 'noopener noreferrer' }
        : { to: currentBanner.link_url };

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
                                src={banner.image_url}
                                alt={banner.title}
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

// Helper for slower smooth scroll
const smoothScrollTo = (target: HTMLElement, duration: number = 1500) => {
    const targetPosition = target.getBoundingClientRect().top + window.scrollY - 100; // Offset for header
    const startPosition = window.scrollY;
    const distance = targetPosition - startPosition;
    let startTime: number | null = null;

    const animation = (currentTime: number) => {
        if (startTime === null) startTime = currentTime;
        const timeElapsed = currentTime - startTime;
        const run = ease(timeElapsed, startPosition, distance, duration);
        window.scrollTo(0, run);
        if (timeElapsed < duration) requestAnimationFrame(animation);
    };

    // Easing function (easeInOutVar)
    const ease = (t: number, b: number, c: number, d: number) => {
        t /= d / 2;
        if (t < 1) return c / 2 * t * t + b;
        t--;
        return -c / 2 * (t * (t - 2) - 1) + b;
    };

    requestAnimationFrame(animation);
};

const ImoveisArboPublic = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const searchQuery = searchParams.get('q') || '';

    const [imoveis, setImoveis] = useState<ImovelArbo[]>([]);
    const [cmsSections, setCmsSections] = useState<any[]>([]);
    const [cmsBanners, setCmsBanners] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

    const [searchInput, setSearchInput] = useState(searchQuery);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);

    const resultsRef = useRef<HTMLDivElement>(null);
    const wrapperRef = useRef<HTMLDivElement>(null); // To detect clicks outside

    const handleImageLoad = useCallback((id: string) => {
        setImagesLoaded(prev => ({ ...prev, [id]: true }));
    }, []);

    // Filter suggestions based on input
    useEffect(() => {
        if (!searchInput || searchInput.length < 2) {
            setSuggestions([]);
            return;
        }

        const lowerInput = searchInput.toLowerCase();
        const newSuggestions = new Set<string>();

        imoveis.forEach(imovel => {
            if (imovel.neighborhood?.toLowerCase().includes(lowerInput)) newSuggestions.add(imovel.neighborhood);
            if (imovel.city?.toLowerCase().includes(lowerInput)) newSuggestions.add(imovel.city);
            if (imovel.listing_id?.toLowerCase().includes(lowerInput)) newSuggestions.add(imovel.listing_id);
            if (imovel.property_type?.toLowerCase().includes(lowerInput)) newSuggestions.add(imovel.property_type);
        });

        // Limit to 5 suggestions
        setSuggestions(Array.from(newSuggestions).slice(0, 5));
    }, [searchInput, imoveis]);

    // Improved scroll effect
    useEffect(() => {
        if (searchQuery && resultsRef.current) {
            // Delay slightly to ensure render
            setTimeout(() => {
                smoothScrollTo(resultsRef.current!, 1000); // 1 second duration
            }, 100);
        }
    }, [searchQuery]);

    // Close suggestions on click outside
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, []);

    useEffect(() => {
        const loadData = async () => {
            try {
                // Load Imoveis
                const { data: imoveisData, error } = await supabase
                    .from('imoveis_arbo')
                    .select('id, title, price, city, neighborhood, property_type, transaction_type, features, bedrooms, bathrooms, living_area, featured, publication_type, listing_id, primary_image, images')
                    .eq('active', true)
                    .order('featured', { ascending: false })
                    .order('last_update_date', { ascending: false });

                if (error) throw error;
                setImoveis((imoveisData as ImovelArbo[]) || []);

                // Load CMS Data
                const [sections, banners] = await Promise.all([
                    cmsService.getSections(),
                    cmsService.getBanners()
                ]);

                setCmsSections(sections.filter(s => s.active));
                setCmsBanners(banners.filter(b => b.active));

            } catch (error) {
                console.error('Erro ao carregar dados:', error);
            } finally {
                setLoading(false);
            }
        };

        loadData();
    }, []);

    const handleSearchCheck = (e?: React.FormEvent) => {
        e?.preventDefault();
        setShowSuggestions(false);
        if (searchInput.trim()) {
            setSearchParams({ q: searchInput });
        } else {
            setSearchParams({});
        }
    };

    const handleSuggestionClick = (suggestion: string) => {
        setSearchInput(suggestion);
        setShowSuggestions(false);
        setSearchParams({ q: suggestion });
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSearchCheck();
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

    // CMS Filter Helper
    const getSectionImoveis = useCallback((filters: any) => {
        if (!filters) return [];

        let filtered = [...imoveis];

        if (filters.featured) {
            filtered = filtered.filter(i => i.featured);
        }

        if (filters.neighborhoods && filters.neighborhoods.length > 0) {
            filtered = filtered.filter(i =>
                filters.neighborhoods.some((n: string) => i.neighborhood?.toLowerCase().includes(n.toLowerCase()))
            );
        }

        if (filters.property_types && filters.property_types.length > 0) {
            filtered = filtered.filter(i =>
                filters.property_types.some((t: string) => i.property_type?.toLowerCase().includes(t.toLowerCase()))
            );
        }

        if (filters.features && filters.features.length > 0) {
            filtered = filtered.filter(i =>
                i.features?.some(f => filters.features.some((filterF: string) => f.toLowerCase().includes(filterF.toLowerCase())))
            );
        }

        if (filters.publication_type) {
            filtered = filtered.filter(i => i.publication_type === filters.publication_type);
        }

        return filtered.slice(0, 10); // Limit to 10 items
    }, [imoveis]);

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

            <main className="flex-grow container mx-auto px-4 sm:px-6 py-8 w-full max-w-[95%]">
                {/* Search Hero with Custom Background */}
                <div className="mb-12 relative rounded-3xl bg-black overflow-hidden min-h-[750px] flex flex-col items-center justify-center text-center">
                    {/* Background Image */}
                    <div className="absolute inset-0 z-0">
                        {loading ? (
                            <div className="w-full h-full bg-neutral-900 animate-pulse" />
                        ) : (
                            <img
                                src={cmsSections.find(s => s.type === 'hero')?.content?.background_image || heroSearchBg}
                                alt="Background"
                                className="w-full h-full object-cover opacity-85"
                            />
                        )}
                        {/* Light black overlay + Gradient */}
                        <div className="absolute inset-0 bg-black/5" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/5 to-black/30" />
                    </div>

                    {/* Content */}
                    <div className="relative z-10 w-full max-w-5xl mx-auto px-4 flex flex-col items-center">
                        {loading ? (
                            <>
                                <div className="h-12 md:h-16 w-3/4 max-w-xl bg-white/10 animate-pulse rounded-lg mb-4" />
                                <div className="h-6 md:h-10 w-1/2 max-w-md bg-white/10 animate-pulse rounded-lg mb-10" />
                            </>
                        ) : (
                            <>
                                <h1 className="text-4xl md:text-6xl font-bold text-white mb-2 drop-shadow-lg tracking-tight">
                                    {cmsSections.find(s => s.type === 'hero')?.title || 'Imobiliária Geum.'}
                                </h1>
                                <p className="text-xl md:text-3xl font-medium text-white/90 mb-10 drop-shadow-md tracking-wide">
                                    {cmsSections.find(s => s.type === 'hero')?.subtitle || 'Encontre seu próximo imóvel.'}
                                </p>
                            </>
                        )}

                        {/* Search Bar - Reference Style */}
                        <div className="w-full bg-white rounded-full p-1.5 shadow-2xl flex flex-col md:flex-row items-center gap-2 md:gap-0 animate-in zoom-in-95 duration-500 max-w-4xl">

                            {/* Transaction Type */}
                            <div className="relative group w-full md:w-auto min-w-[110px]">
                                <select
                                    className="w-full appearance-none bg-transparent py-2.5 pl-6 pr-8 text-foreground font-medium outline-none cursor-pointer hover:bg-muted/50 rounded-full transition-colors truncate text-sm md:text-base"
                                    defaultValue="Venda"
                                >
                                    <option value="For Sale">Venda</option>
                                    <option value="For Rent">Locação</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronLeft className="h-3.5 w-3.5 -rotate-90" />
                                </div>
                            </div>

                            <div className="hidden md:block w-px h-6 bg-border mx-1" />

                            {/* Property Type */}
                            <div className="relative group w-full md:w-auto min-w-[150px]">
                                <select
                                    className="w-full appearance-none bg-transparent py-2.5 pl-6 pr-8 text-foreground font-medium outline-none cursor-pointer hover:bg-muted/50 rounded-full transition-colors truncate text-sm md:text-base"
                                >
                                    <option value="">Tipo de imóvel</option>
                                    <option value="Apartment">Apartamento</option>
                                    <option value="House">Casa</option>
                                    <option value="Condo">Em Condomínio</option>
                                    <option value="Land">Terreno</option>
                                </select>
                                <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                                    <ChevronLeft className="h-3.5 w-3.5 -rotate-90" />
                                </div>
                            </div>

                            <div className="hidden md:block w-px h-6 bg-border mx-1" />

                            {/* Search Input */}
                            <div className="relative flex-grow w-full" ref={wrapperRef}>
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground hidden md:block" />
                                <input
                                    type="text"
                                    placeholder="Pesquise por bairro, cidade ou código..."
                                    className="w-full h-10 md:h-12 pl-4 md:pl-10 pr-4 bg-transparent border-0 outline-none text-foreground placeholder:text-muted-foreground text-sm md:text-base"
                                    value={searchInput}
                                    onChange={(e) => {
                                        setSearchInput(e.target.value);
                                        setShowSuggestions(true);
                                    }}
                                    onFocus={() => setShowSuggestions(true)}
                                    onKeyDown={handleKeyDown}
                                />

                                {/* Autocomplete Dropdown */}
                                {showSuggestions && suggestions.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-xl shadow-xl overflow-hidden z-50 border border-border/10 animate-in fade-in zoom-in-95 duration-200">
                                        <ul className="py-2">
                                            {suggestions.map((suggestion, index) => (
                                                <li
                                                    key={index}
                                                    onClick={() => handleSuggestionClick(suggestion)}
                                                    className="px-4 py-2 hover:bg-muted/50 cursor-pointer text-sm text-foreground flex items-center gap-2 group transition-colors"
                                                >
                                                    <Search className="h-3.5 w-3.5 text-muted-foreground group-hover:text-primary" />
                                                    {suggestion}
                                                </li>
                                            ))}
                                        </ul>
                                    </div>
                                )}
                            </div>

                            {/* Filters Button (Visual) */}
                            <button className="hidden md:flex items-center gap-2 px-4 py-2 text-muted-foreground hover:text-foreground font-medium hover:bg-muted/50 rounded-full transition-colors whitespace-nowrap text-sm md:text-base">
                                <div className="h-4 w-4 border-2 border-current rounded bg-transparent" /> {/* Icon replacement */}
                                Filtros
                            </button>

                            {/* Submit Button */}
                            <button
                                onClick={handleSearchCheck}
                                className="w-full md:w-auto h-10 md:h-12 px-8 bg-black hover:bg-black/90 text-white font-bold rounded-full transition-all shadow-lg hover:shadow-xl active:scale-95 flex items-center justify-center gap-2 text-sm md:text-base cursor-pointer"
                            >
                                <Search className="h-4 w-4 md:hidden" />
                                <span className="hidden md:inline">Buscar</span>
                                <span className="md:hidden">Buscar</span>
                            </button>
                        </div>

                        {/* CTA Link */}
                        <a href="https://geumimob.com/contato" className="mt-8 text-white/90 hover:text-white font-medium flex items-center gap-2 hover:underline underline-offset-4 transition-all drop-shadow-md">
                            Anuncie seu imóvel gratuitamente
                            <ArrowRight className="h-4 w-4" />
                        </a>
                    </div>
                </div>

                {searchQuery ? (
                    /* Search Results View */
                    <div ref={resultsRef} className="animate-in fade-in slide-in-from-bottom-4 duration-500 scroll-mt-24">
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
                    /* Showcase View - CMS Driven */
                    <div className="space-y-4 animate-in fade-in duration-700">
                        {cmsSections.length > 0 ? (
                            cmsSections.map((section) => {
                                if (section.type === 'banner_carousel') {
                                    return <BannerCarousel key={section.id} banners={cmsBanners} />;
                                }

                                if (section.type === 'media_grid') {
                                    return <MediaSection key={section.id} />;
                                }

                                if (section.type === 'property_list') {
                                    const sectionImoveis = getSectionImoveis(section.content?.filters);
                                    if (sectionImoveis.length === 0) return null;

                                    return (
                                        <PropertySection
                                            key={section.id}
                                            title={section.title || ''}
                                            subtitle={section.subtitle}
                                            imoveis={sectionImoveis}
                                            loading={loading}
                                            imagesLoaded={imagesLoaded}
                                            onImageLoad={handleImageLoad}
                                        />
                                    );
                                }

                                return null;
                            })
                        ) : (
                            // Fallback skeleton if CMS is empty or loading
                            loading ? (
                                <div className="space-y-12">
                                    <div className="h-96 bg-muted animate-pulse rounded-2xl" />
                                    <div className="space-y-4">
                                        <div className="h-8 w-64 bg-muted animate-pulse rounded" />
                                        <div className="flex gap-4 overflow-hidden">
                                            {[1, 2, 3, 4].map(i => <div key={i} className="h-80 w-80 bg-muted animate-pulse rounded-xl flex-shrink-0" />)}
                                        </div>
                                    </div>
                                </div>
                            ) : null
                        )}
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
