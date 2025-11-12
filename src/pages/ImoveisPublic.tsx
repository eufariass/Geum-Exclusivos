import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Car, Maximize, Home } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const ImoveisPublic = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Imóveis Exclusivos Geum.';
  }, []);

  useEffect(() => {
    const loadImoveis = async () => {
      try {
        const data = await supabaseStorageService.getImoveis();
        setImoveis(data);
      } catch (error) {
        console.error('Erro ao carregar imóveis:', error);
      } finally {
        setLoading(false);
      }
    };

    loadImoveis();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Carregando imóveis...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card sticky top-0 z-10 shadow-sm">
        <div className="container mx-auto px-4 py-4 flex items-center justify-center">
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
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-7xl">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Imóveis Exclusivos</h1>
          <p className="text-muted-foreground">Conheça nossa seleção de imóveis exclusivos</p>
        </div>

        {imoveis.length === 0 ? (
          <Card className="p-12 text-center">
            <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-semibold mb-2">Nenhum imóvel disponível</h2>
            <p className="text-muted-foreground">Em breve teremos novidades</p>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {imoveis.map((imovel) => (
              <Link 
                key={imovel.id} 
                to={`/${imovel.codigo}`}
                className="group"
              >
                <Card className="overflow-hidden card-hover h-full transition-all hover:shadow-lg">
                  <div className="relative h-56 bg-muted overflow-hidden">
                    {imovel.image_urls && imovel.image_urls.length > 0 ? (
                      <>
                        <img
                          src={imovel.image_urls[imovel.cover_image_index || 0]}
                          alt={imovel.endereco}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        />
                        {imovel.image_urls.length > 1 && (
                          <div className="absolute bottom-3 left-3 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium">
                            {imovel.image_urls.length} fotos
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                        <Home className="h-20 w-20 text-muted-foreground/40" />
                      </div>
                    )}
                    <div className="absolute top-3 left-3 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
                      {imovel.tipo}
                    </div>
                    <div className="absolute top-3 right-3 px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold">
                      {imovel.codigo}
                    </div>
                  </div>

                  <CardContent className="p-4 space-y-3">
                    {imovel.titulo && (
                      <h2 className="text-lg font-semibold line-clamp-2 mb-2">{imovel.titulo}</h2>
                    )}
                    
                    <div>
                      <p className="text-sm text-muted-foreground mb-1">Endereço</p>
                      <p className="font-medium line-clamp-2">{imovel.endereco}</p>
                    </div>

                    {imovel.valor && (
                      <div className="pt-2 border-t">
                        <p className="text-xl font-bold text-primary">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                          }).format(imovel.valor)}
                        </p>
                      </div>
                    )}

                    {/* Características */}
                    {(imovel.quartos || imovel.banheiros || imovel.area_m2 || imovel.vagas) && (
                      <div className="flex flex-wrap gap-3 pt-2 border-t">
                        {imovel.quartos && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <BedDouble className="h-4 w-4" />
                            <span>{imovel.quartos}</span>
                          </div>
                        )}
                        {imovel.banheiros && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Bath className="h-4 w-4" />
                            <span>{imovel.banheiros}</span>
                          </div>
                        )}
                        {imovel.area_m2 && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Maximize className="h-4 w-4" />
                            <span>{imovel.area_m2}m²</span>
                          </div>
                        )}
                        {imovel.vagas && (
                          <div className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Car className="h-4 w-4" />
                            <span>{imovel.vagas}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
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

export default ImoveisPublic;
