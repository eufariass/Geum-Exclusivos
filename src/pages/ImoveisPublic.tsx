import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BedDouble, Bath, Car, Maximize, Home, Search, Phone, Mail, Clock, MapPin } from 'lucide-react';
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

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-accent/10 via-background to-background py-16 md:py-24">
        <div className="container mx-auto px-4 max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-foreground mb-6">
              Encontre o Imóvel dos seus Sonhos
            </h1>
            <p className="text-lg md:text-xl text-muted-foreground mb-8">
              Imóveis selecionados com excelência para você e sua família
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" className="gap-2">
                <Search className="h-5 w-5" />
                Ver Todos os Imóveis
              </Button>
              <Button size="lg" variant="outline" className="gap-2">
                <Phone className="h-5 w-5" />
                Fale Conosco
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-3">Imóveis Exclusivos</h2>
          <p className="text-lg text-muted-foreground">Conheça nossa seleção de imóveis premium</p>
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
      <footer className="border-t border-border mt-20 bg-card">
        <div className="container mx-auto px-4 py-12 max-w-7xl">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Logo e CRECI */}
            <div className="space-y-4">
              <img 
                src={logoBlack} 
                alt="Imobiliária Geum" 
                className="h-12 dark:hidden"
              />
              <img 
                src={logoWhite} 
                alt="Imobiliária Geum" 
                className="h-12 hidden dark:block"
              />
              <p className="text-sm text-muted-foreground font-medium">
                CRECI: 7997
              </p>
            </div>

            {/* Conheça */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Conheça</h3>
              <ul className="space-y-3">
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Estância Albatroz
                  </a>
                </li>
                <li>
                  <a href="#" className="text-muted-foreground hover:text-foreground transition-colors">
                    Greenwich Park
                  </a>
                </li>
              </ul>
            </div>

            {/* Contato */}
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-4">Contato</h3>
              <div className="space-y-4">
                {/* Sede Geum */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-foreground text-sm">Sede Geum</h4>
                  <div className="space-y-2 text-sm text-muted-foreground">
                    <p className="flex items-start gap-2">
                      <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                      <span>Rua Senador Souza Naves, 2245 - Londrilar, Paraná</span>
                    </p>
                    <p className="flex items-center gap-2">
                      <Phone className="h-4 w-4 flex-shrink-0" />
                      <a href="tel:+554333413000" className="hover:text-foreground transition-colors">
                        (43) 3341-3000
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Mail className="h-4 w-4 flex-shrink-0" />
                      <a href="mailto:contato@geumimob.com" className="hover:text-foreground transition-colors">
                        contato@geumimob.com
                      </a>
                    </p>
                    <p className="flex items-center gap-2">
                      <Clock className="h-4 w-4 flex-shrink-0" />
                      <span>Segunda à Sexta - 08h30 às 18h</span>
                    </p>
                  </div>
                </div>

                {/* Geum Carbamall */}
                <div className="space-y-2 pt-4 border-t border-border/50">
                  <h4 className="font-semibold text-foreground text-sm">Geum Carbamall</h4>
                  <p className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    <span>Rod. Mábio Gonçalves Palhano, 200 - Gleba Palhano, PR - Paraná</span>
                  </p>
                  <a href="#" className="inline-block text-sm text-accent hover:text-accent/80 transition-colors">
                    Fale conosco
                  </a>
                </div>
              </div>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-12 pt-8 border-t border-border text-center">
            <p className="text-sm text-muted-foreground">
              © {new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImoveisPublic;
