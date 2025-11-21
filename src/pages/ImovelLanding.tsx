import { useEffect, useState } from 'react';
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
  const [imovel, setImovel] = useState<Imovel | null>(null);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Imóveis Exclusivos Geum.';
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
        }
      } catch (error) {
        console.error('Erro ao carregar imóvel:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImovel();
  }, [codigo]);

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
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando...</p>
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
                  alt={`${imovel.endereco} - Foto ${currentImageIndex + 1}`}
                  className="w-full h-full object-cover"
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
                      className={`flex-shrink-0 w-20 h-20 rounded-md overflow-hidden border-2 transition-all ${
                        index === currentImageIndex
                          ? 'border-primary scale-105'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <img
                        src={url}
                        alt={`Miniatura ${index + 1}`}
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
          {/* Coluna Esquerda - Informações do Imóvel */}
          <div className="lg:col-span-2 space-y-6">
            {/* Informações Principais */}
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

            {/* Descrição */}
            {imovel.descricao && (
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
            )}

            {/* Mapa de Localização */}
            <LocationMap cep={(imovel as any).cep} endereco={imovel.endereco} />
          </div>

          {/* Coluna Direita - Formulário Fixo */}
          <div className="lg:col-span-1">
            <div className="lg:sticky lg:top-24">
              <LeadForm 
                imovelId={imovel.id}
                imovelCodigo={imovel.codigo}
                imovelValor={imovel.valor}
                tiposDisponiveis={imovel.tipos_disponiveis}
              />
            </div>
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
