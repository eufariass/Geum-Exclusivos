import { useEffect, useState, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChevronLeft, ChevronRight, Home, BedDouble, Bath, Car, Maximize } from 'lucide-react';
import { LeadForm } from '@/components/leads/LeadForm';
import { LocationMap } from '@/components/LocationMap';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const ImovelLanding = () => {
  const { codigo } = useParams<{ codigo: string }>();

  // Safety check to prevent routing collisions
  if (codigo?.toLowerCase() === 'imoveis') {
    return null; // Let the correct route handle it, or show nothing if matched incorrectly
  }

  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  // Update document metadata when imovel loads
  const updateSEO = useCallback((imovelData: Imovel) => {
    // Update title
    const title = imovelData.titulo
      ? `${imovelData.titulo} | ${imovelData.tipo} em Londrina | Imobiliária Geum`
      : `${imovelData.tipo} em ${imovelData.endereco} | Imobiliária Geum`;
    document.title = title;

    // Update meta description
    const description = imovelData.descricao
      ? imovelData.descricao.substring(0, 160)
      : `${imovelData.tipo} ${imovelData.quartos ? `com ${imovelData.quartos} quartos` : ''} em ${imovelData.endereco}. ${imovelData.valor ? `Valor: R$ ${imovelData.valor.toLocaleString('pt-BR')}` : ''} Imobiliária Geum Londrina.`;

    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', description);

    // Update Open Graph tags
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
    updateOrCreateMeta('og:url', `https://exclusivos.geumimob.com/${imovelData.codigo}`);
    updateOrCreateMeta('og:type', 'website');
    if (imovelData.image_urls && imovelData.image_urls.length > 0) {
      updateOrCreateMeta('og:image', imovelData.image_urls[imovelData.cover_image_index || 0]);
    }

    // Inject JSON-LD structured data for the property
    const existingSchema = document.getElementById('property-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    const schema = {
      "@context": "https://schema.org",
      "@type": "RealEstateListing",
      "name": imovelData.titulo || `${imovelData.tipo} em ${imovelData.endereco}`,
      "description": imovelData.descricao || `${imovelData.tipo} disponível em ${imovelData.endereco}`,
      "url": `https://exclusivos.geumimob.com/${imovelData.codigo}`,
      "image": imovelData.image_urls || [],
      "address": {
        "@type": "PostalAddress",
        "streetAddress": imovelData.endereco,
        "addressLocality": "Londrina",
        "addressRegion": "PR",
        "addressCountry": "BR"
      },
      "offers": imovelData.valor ? {
        "@type": "Offer",
        "price": imovelData.valor,
        "priceCurrency": "BRL",
        "availability": "https://schema.org/InStock"
      } : undefined,
      "numberOfRooms": imovelData.quartos,
      "numberOfBathroomsTotal": imovelData.banheiros,
      "floorSize": imovelData.area_m2 ? {
        "@type": "QuantitativeValue",
        "value": imovelData.area_m2,
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
      if (!codigo) return;

      try {
        const imoveis = await supabaseStorageService.getImoveis();
        const found = imoveis.find(i => i.codigo === codigo.toUpperCase());

        if (found) {
          setImovel(found);
          setCurrentImageIndex(found.cover_image_index || 0);
          updateSEO(found);
        }
      } catch (error) {
        console.error('Erro ao carregar imóvel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImovel();

    // Cleanup SEO tags when leaving the page
    return () => {
      const propertySchema = document.getElementById('property-schema');
      if (propertySchema) {
        propertySchema.remove();
      }
    };
  }, [codigo, updateSEO]);

  const nextImage = () => {
    if (imovel?.image_urls && imovel.image_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev + 1) % imovel.image_urls!.length);
    }
  };

  const prevImage = () => {
    if (imovel?.image_urls && imovel.image_urls.length > 0) {
      setCurrentImageIndex((prev) => (prev - 1 + imovel.image_urls!.length) % imovel.image_urls!.length);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        {/* Header skeleton */}
        <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
          <div className="container mx-auto px-4 py-4 flex items-center justify-between">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="h-4 w-16 bg-muted rounded animate-pulse" />
          </div>
        </header>
        <main className="container mx-auto px-4 py-8 max-w-7xl">
          {/* Image gallery skeleton */}
          <div className="mb-6 rounded-xl overflow-hidden border border-border">
            <div className="aspect-video bg-muted animate-pulse" />
            <div className="p-4 flex gap-2">
              {[1, 2, 3, 4].map((i) => (
                <div key={i} className="w-20 h-20 bg-muted rounded-md animate-pulse" />
              ))}
            </div>
          </div>
          {/* Content skeleton */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-card border border-border rounded-xl p-6 space-y-4">
                <div className="h-8 bg-muted rounded w-3/4 animate-pulse" />
                <div className="h-4 bg-muted rounded w-1/2 animate-pulse" />
                <div className="h-4 bg-muted rounded w-full animate-pulse" />
                <div className="flex gap-4">
                  <div className="h-6 bg-muted rounded w-20 animate-pulse" />
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
        <p className="text-muted-foreground">O código informado não corresponde a nenhum imóvel cadastrado.</p>
        <Link to="/">
          <Button variant="outline">Voltar</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <Link to="/" className="cursor-pointer">
            <img
              src={logoBlack}
              alt="Imobiliária Geum"
              className="h-10 dark:hidden"
            />
            <img
              src={logoWhite}
              alt="Imobiliária Geum"
              className="h-10 hidden dark:block"
            />
          </Link>
          <p className="text-sm text-muted-foreground">Exclusivo</p>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Galeria de Imagens - Full Width */}
        {imovel.image_urls && imovel.image_urls.length > 0 && (
          <Card className="mb-6 overflow-hidden">
            <CardContent className="p-0 relative">
              <div className="relative aspect-video bg-muted">
                <img
                  src={imovel.image_urls[currentImageIndex]}
                  alt={`${imovel.titulo || imovel.tipo} em ${imovel.endereco} - Foto ${currentImageIndex + 1} de ${imovel.image_urls.length} | Imobiliária Geum Londrina`}
                  title={`${imovel.titulo || imovel.tipo} - ${imovel.endereco}`}
                  className="w-full h-full object-cover"
                  fetchPriority="high"
                />

                {/* Botões de navegação */}
                {imovel.image_urls.length > 1 && (
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

                {/* Contador de imagens */}
                <div className="absolute bottom-4 left-4 bg-black/70 text-white px-3 py-1 rounded-full text-sm">
                  {currentImageIndex + 1} / {imovel.image_urls.length}
                </div>
              </div>

              {/* Miniaturas */}
              {imovel.image_urls.length > 1 && (
                <div className="p-4 flex gap-2 overflow-x-auto">
                  {imovel.image_urls.map((url, index) => (
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
                        alt={`${imovel.titulo || imovel.tipo} - Miniatura ${index + 1}`}
                        loading="lazy"
                        decoding="async"
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
          {/* Informações Principais - Título (ordem 1 em mobile) */}
          <div className="order-1 lg:col-span-2">
            <Card>
              <CardContent className="p-6 space-y-4">
                {imovel.titulo && (
                  <div>
                    <h1 className="text-2xl font-bold text-foreground">{imovel.titulo}</h1>
                  </div>
                )}

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Código</p>
                  <p className="text-lg font-semibold text-foreground">{imovel.codigo}</p>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                  <p className="text-lg text-foreground">{imovel.endereco}</p>
                </div>

                <div className="space-y-4">
                  <div className="flex gap-6">
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Tipo</p>
                      <p className="text-base text-foreground">{imovel.tipo}</p>
                    </div>

                    {imovel.valor && (
                      <div>
                        <p className="text-sm text-muted-foreground mb-1">Valor</p>
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(imovel.valor)}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Características */}
                  {(imovel.quartos || imovel.banheiros || imovel.area_m2 || imovel.vagas) && (
                    <div className="flex flex-wrap gap-4 pt-2">
                      {imovel.quartos && (
                        <div className="flex items-center gap-2 text-foreground">
                          <BedDouble className="h-5 w-5 text-muted-foreground" />
                          <span>{imovel.quartos} {imovel.quartos === 1 ? 'Quarto' : 'Quartos'}</span>
                        </div>
                      )}
                      {imovel.banheiros && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Bath className="h-5 w-5 text-muted-foreground" />
                          <span>{imovel.banheiros} {imovel.banheiros === 1 ? 'Banheiro' : 'Banheiros'}</span>
                        </div>
                      )}
                      {imovel.area_m2 && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Maximize className="h-5 w-5 text-muted-foreground" />
                          <span>{imovel.area_m2} m²</span>
                        </div>
                      )}
                      {imovel.vagas && (
                        <div className="flex items-center gap-2 text-foreground">
                          <Car className="h-5 w-5 text-muted-foreground" />
                          <span>{imovel.vagas} {imovel.vagas === 1 ? 'Vaga' : 'Vagas'}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Formulário - ordem 2 em mobile, coluna direita no desktop */}
          <div className="order-2 lg:order-4 lg:col-span-1 lg:row-span-3">
            <div className="lg:sticky lg:top-24">
              <LeadForm
                imovelId={imovel.id}
                imovelCodigo={imovel.codigo}
                imovelValor={imovel.valor}
                tiposDisponiveis={imovel.tipos_disponiveis}
              />
            </div>
          </div>

          {/* Descrição - Sobre o Imóvel (ordem 3 em mobile) */}
          {imovel.descricao && (
            <div className="order-3 lg:col-span-2">
              <Card>
                <CardContent className="p-6">
                  <h2 className="text-xl font-semibold text-foreground mb-4">Sobre o Imóvel</h2>
                  <p
                    className="text-[15px] leading-[1.7] text-foreground whitespace-pre-wrap"
                    style={{ textAlign: 'justify', fontFamily: 'Inter, sans-serif' }}
                  >
                    {imovel.descricao}
                  </p>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Mapa de Localização (ordem 4 em mobile) */}
          <div className="order-4 lg:col-span-2">
            <LocationMap cep={(imovel as any).cep} endereco={imovel.endereco} />
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

export default ImovelLanding;
