import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import type { ImovelArbo } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, BedDouble, Bath, Car, Maximize, Calendar, Tag } from 'lucide-react';
import { LeadFormArbo } from '@/components/leads/LeadFormArbo';
import { LocationMap } from '@/components/LocationMap';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const ImovelArboLanding = () => {
    const { listingId } = useParams<{ listingId: string }>();
    const [imovel, setImovel] = useState<ImovelArbo | null>(null);
    const [currentImageIndex, setCurrentImageIndex] = useState(0);
    const [loading, setLoading] = useState(true);

    // Update document metadata when imovel loads
    const updateSEO = useCallback((imovelData: ImovelArbo) => {
        const title = imovelData.title
            ? `${imovelData.title} | ${imovelData.property_type} em ${imovelData.city} | Imobiliária Geum`
            : `${imovelData.property_type} em ${imovelData.neighborhood}, ${imovelData.city} | Imobiliária Geum`;
        document.title = title;

        const description = imovelData.description
            ? imovelData.description.substring(0, 160)
            : `${imovelData.property_type} ${imovelData.bedrooms ? `com ${imovelData.bedrooms} quartos` : ''} em ${imovelData.neighborhood}, ${imovelData.city}. ${imovelData.price ? `Valor: R$ ${imovelData.price.toLocaleString('pt-BR')}` : ''} Imobiliária Geum.`;

        let metaDescription = document.querySelector('meta[name="description"]');
        if (!metaDescription) {
            metaDescription = document.createElement('meta');
            metaDescription.setAttribute('name', 'description');
            document.head.appendChild(metaDescription);
        }
        metaDescription.setAttribute('content', description);

        const updateOrCreateMeta = (property: string, content: string) => {
            let meta = document.querySelector(`meta[property="${property}"]`);
            if (!meta) {
                meta = document.createElement('meta');
                meta.setAttribute('property', property);
                document.head.appendChild(meta);
            }
            meta.setAttribute('content', content);
        };

        updateOrCreateMeta('og:title', title);
        updateOrCreateMeta('og:description', description);
        updateOrCreateMeta('og:url', `https://imoveis.geumimob.com/imovel/${imovelData.listing_id}`);
        updateOrCreateMeta('og:type', 'website');
        if (imovelData.primary_image) {
            updateOrCreateMeta('og:image', imovelData.primary_image);
        }

        // JSON-LD structured data
        const existingSchema = document.getElementById('property-schema');
        if (existingSchema) existingSchema.remove();

        const schema = {
            "@context": "https://schema.org",
            "@type": "RealEstateListing",
            "name": imovelData.title || `${imovelData.property_type} em ${imovelData.neighborhood}`,
            "description": imovelData.description || `${imovelData.property_type} disponível em ${imovelData.address}`,
            "url": `https://imoveis.geumimob.com/imovel/${imovelData.listing_id}`,
            "image": imovelData.images || [],
            "address": {
                "@type": "PostalAddress",
                "streetAddress": imovelData.address,
                "addressLocality": imovelData.city,
                "addressRegion": imovelData.state_abbr,
                "postalCode": imovelData.postal_code,
                "addressCountry": "BR"
            },
            "geo": imovelData.latitude && imovelData.longitude ? {
                "@type": "GeoCoordinates",
                "latitude": imovelData.latitude,
                "longitude": imovelData.longitude
            } : undefined,
            "offers": imovelData.price ? {
                "@type": "Offer",
                "price": imovelData.price,
                "priceCurrency": "BRL",
                "availability": "https://schema.org/InStock"
            } : undefined,
            "numberOfRooms": imovelData.bedrooms,
            "numberOfBathroomsTotal": imovelData.bathrooms,
            "floorSize": imovelData.living_area ? {
                "@type": "QuantitativeValue",
                "value": imovelData.living_area,
                "unitCode": "MTK"
            } : undefined,
            "broker": {
                "@type": "RealEstateAgent",
                "name": "Imobiliária Geum",
                "url": "https://geumimob.com",
                "telephone": "+55-43-3341-3000"
            }
        };

        const script = document.createElement('script');
        script.id = 'property-schema';
        script.type = 'application/ld+json';
        script.textContent = JSON.stringify(schema);
        document.head.appendChild(script);
    }, []);

    useEffect(() => {
        const loadImovel = async () => {
            if (!listingId) return;

            try {
                const { data, error } = await supabase
                    .from('imoveis_arbo')
                    .select('*')
                    .eq('listing_id', listingId.toUpperCase())
                    .eq('active', true)
                    .single();

                if (error) throw error;

                if (data) {
                    setImovel(data as ImovelArbo);
                    updateSEO(data as ImovelArbo);
                }
            } catch (error) {
                console.error('Erro ao carregar imóvel:', error);
            } finally {
                setLoading(false);
            }
        };

        loadImovel();

        return () => {
            const propertySchema = document.getElementById('property-schema');
            if (propertySchema) propertySchema.remove();
        };
    }, [listingId, updateSEO]);

    const nextImage = () => {
        if (imovel?.images && imovel.images.length > 0) {
            setCurrentImageIndex((prev) => (prev + 1) % imovel.images!.length);
        }
    };

    const prevImage = () => {
        if (imovel?.images && imovel.images.length > 0) {
            setCurrentImageIndex((prev) => (prev - 1 + imovel.images!.length) % imovel.images!.length);
        }
    };

    const formatPrice = (price?: number) => {
        if (!price) return 'Sob consulta';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const transactionLabel = imovel?.transaction_type === 'For Sale' ? 'Venda' : 'Locação';

    if (loading) {
        return (
            <div className="min-h-screen bg-background">
                <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
                    <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                        <div className="h-10 w-32 bg-muted rounded animate-pulse" />
                        <div className="h-4 w-16 bg-muted rounded animate-pulse" />
                    </div>
                </header>
                <main className="container mx-auto px-4 py-8 max-w-7xl">
                    <div className="mb-6 rounded-xl overflow-hidden border border-border">
                        <div className="aspect-video bg-muted animate-pulse" />
                        <div className="p-4 flex gap-2">
                            {[1, 2, 3, 4].map((i) => (
                                <div key={i} className="w-20 h-20 bg-muted rounded-md animate-pulse" />
                            ))}
                        </div>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <div className="lg:col-span-2 space-y-6">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
                                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                                <div className="flex gap-4">
                                    <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                                    <div className="h-6 bg-muted rounded w-20 animate-pulse" />
                                </div>
                            </div>
                        </div>
                        <div className="lg:col-span-1">
                            <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                                <div className="h-8 bg-muted rounded w-1/2 animate-pulse" />
                                <div className="h-10 bg-muted rounded w-full animate-pulse" />
                                <div className="h-10 bg-muted rounded w-full animate-pulse" />
                                <div className="h-12 bg-muted rounded w-full animate-pulse" />
                            </div>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (!imovel) {
        return (
            <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
                <Home className="h-16 w-16 text-muted-foreground" />
                <h1 className="text-2xl font-semibold text-foreground">Imóvel não encontrado</h1>
                <p className="text-muted-foreground">O código informado não corresponde a nenhum imóvel disponível.</p>
                <Link to="/imoveis">
                    <Button variant="outline">Ver todos os imóveis</Button>
                </Link>
            </div>
        );
    }

    const images = imovel.images || (imovel.primary_image ? [imovel.primary_image] : []);
    const fullAddress = [imovel.address, imovel.street_number, imovel.neighborhood, imovel.city, imovel.state_abbr]
        .filter(Boolean)
        .join(', ');

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
                <div className="container mx-auto px-4 py-4 flex items-center justify-between">
                    <Link to="/imoveis" className="cursor-pointer">
                        <img src={logoBlack} alt="Imobiliária Geum" className="h-10 dark:hidden" />
                        <img src={logoWhite} alt="Imobiliária Geum" className="h-10 hidden dark:block" />
                    </Link>
                    <div className="flex items-center gap-2">
                        <Tag className="h-4 w-4 text-primary" />
                        <p className="text-sm font-medium text-primary">{transactionLabel}</p>
                    </div>
                </div>
            </header>

            <main className="container mx-auto px-4 py-8 max-w-7xl">
                {/* Galeria de Imagens */}
                {images.length > 0 && (
                    <Card className="mb-6 overflow-hidden">
                        <CardContent className="p-0 relative">
                            <div className="relative aspect-video bg-muted">
                                <img
                                    src={images[currentImageIndex]}
                                    alt={`${imovel.title || imovel.property_type} - Foto ${currentImageIndex + 1}`}
                                    className="w-full h-full object-cover"
                                    fetchPriority="high"
                                />

                                {images.length > 1 && (
                                    <>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                                            onClick={prevImage}
                                        >
                                            <ChevronLeft className="h-5 w-5" />
                                        </Button>
                                        <Button
                                            variant="secondary"
                                            size="icon"
                                            className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full shadow-lg"
                                            onClick={nextImage}
                                        >
                                            <ChevronRight className="h-5 w-5" />
                                        </Button>
                                    </>
                                )}

                                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                                    {currentImageIndex + 1} / {images.length}
                                </div>
                            </div>

                            {images.length > 1 && (
                                <div className="p-4 flex gap-2 overflow-x-auto">
                                    {images.map((url, index) => (
                                        <button
                                            key={index}
                                            onClick={() => setCurrentImageIndex(index)}
                                            className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${index === currentImageIndex
                                                    ? 'border-primary scale-105'
                                                    : 'border-border hover:border-primary/50'
                                                }`}
                                        >
                                            <img
                                                src={url}
                                                alt={`Miniatura ${index + 1}`}
                                                loading="lazy"
                                                className="w-full h-full object-cover"
                                            />
                                        </button>
                                    ))}
                                </div>
                            )}
                        </CardContent>
                    </Card>
                )}

                {/* Layout de 2 Colunas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Informações Principais */}
                    <div className="order-1 lg:col-span-2">
                        <Card>
                            <CardContent className="p-6 space-y-4">
                                {imovel.title && (
                                    <h1 className="text-2xl font-bold text-foreground">{imovel.title}</h1>
                                )}

                                <div className="flex flex-wrap gap-4">
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Código</p>
                                        <p className="text-lg font-semibold text-foreground">{imovel.listing_id}</p>
                                    </div>
                                    <div>
                                        <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                                        <p className="text-base text-foreground">{imovel.property_type?.replace('Residential / ', '')}</p>
                                    </div>
                                    {imovel.year_built && (
                                        <div className="flex items-center gap-1.5">
                                            <Calendar className="h-4 w-4 text-muted-foreground" />
                                            <span className="text-sm text-muted-foreground">Construído em {imovel.year_built}</span>
                                        </div>
                                    )}
                                </div>

                                <div>
                                    <p className="text-sm text-muted-foreground mb-1">Localização</p>
                                    <p className="text-lg text-foreground">{fullAddress}</p>
                                </div>

                                <div className="pt-2">
                                    <p className="text-sm text-muted-foreground mb-1">Valor</p>
                                    <p className="text-2xl font-bold text-primary">{formatPrice(imovel.price)}</p>
                                </div>

                                {/* Características */}
                                {(imovel.bedrooms || imovel.bathrooms || imovel.living_area || imovel.garage) && (
                                    <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
                                        {imovel.bedrooms && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <BedDouble className="h-5 w-5 text-muted-foreground" />
                                                <span>{imovel.bedrooms} {imovel.bedrooms === 1 ? 'Quarto' : 'Quartos'}</span>
                                                {imovel.suites && <span className="text-sm text-muted-foreground">({imovel.suites} suíte{imovel.suites > 1 ? 's' : ''})</span>}
                                            </div>
                                        )}
                                        {imovel.bathrooms && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Bath className="h-5 w-5 text-muted-foreground" />
                                                <span>{imovel.bathrooms} {imovel.bathrooms === 1 ? 'Banheiro' : 'Banheiros'}</span>
                                            </div>
                                        )}
                                        {imovel.living_area && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Maximize className="h-5 w-5 text-muted-foreground" />
                                                <span>{imovel.living_area} m²</span>
                                            </div>
                                        )}
                                        {imovel.garage && (
                                            <div className="flex items-center gap-2 text-foreground">
                                                <Car className="h-5 w-5 text-muted-foreground" />
                                                <span>{imovel.garage} {imovel.garage === 1 ? 'Vaga' : 'Vagas'}</span>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {/* Features */}
                                {imovel.features && imovel.features.length > 0 && (
                                    <div className="pt-4">
                                        <p className="text-sm font-medium text-foreground mb-2">Diferenciais</p>
                                        <div className="flex flex-wrap gap-2">
                                            {imovel.features.map((feature, idx) => (
                                                <span
                                                    key={idx}
                                                    className="px-3 py-1 bg-muted text-sm text-foreground rounded-full"
                                                >
                                                    {feature}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>

                    {/* Formulário */}
                    <div className="order-2 lg:order-4 lg:col-span-1 lg:row-span-3">
                        <div className="lg:sticky lg:top-24">
                            <LeadFormArbo imovel={imovel} />
                        </div>
                    </div>

                    {/* Descrição */}
                    {imovel.description && (
                        <div className="order-3 lg:col-span-2">
                            <Card>
                                <CardContent className="p-6">
                                    <h2 className="text-xl font-semibold text-foreground mb-4">Sobre o Imóvel</h2>
                                    <p
                                        className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap"
                                        style={{ textAlign: 'justify' }}
                                    >
                                        {imovel.description}
                                    </p>
                                </CardContent>
                            </Card>
                        </div>
                    )}

                    {/* Mapa */}
                    <div className="order-4 lg:col-span-2">
                        <LocationMap
                            cep={imovel.postal_code || ''}
                            endereco={fullAddress}
                            latitude={imovel.latitude}
                            longitude={imovel.longitude}
                        />
                    </div>
                </div>
            </main>

            {/* Footer */}
            <footer className="border-t border-border mt-12 py-6">
                <div className="container mx-auto px-4 text-center">
                    <p className="text-sm text-muted-foreground">
                        © {new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default ImovelArboLanding;
