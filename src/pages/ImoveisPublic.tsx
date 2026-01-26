import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Car, Maximize, Home, MapPin, Phone, Mail, ArrowRight } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const ImoveisPublic = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    document.title = 'Exclusividade Geum';
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
        <div className="animate-pulse flex flex-col items-center gap-4">
          <div className="h-12 w-12 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-muted-foreground font-medium tracking-wide">Carregando exclusividades...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col font-sans">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50 transition-all duration-300">
        <div className="container mx-auto px-6 py-5 flex items-center justify-between">
          <a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2">
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
          </a>

          <nav className="hidden md:flex items-center gap-8">
            <a href="https://geumimob.com" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Home</a>
            <a href="#" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Imóveis</a>
            
            <a href="https://wa.link/sgqkpd" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors">Contato</a>
          </nav>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-6 py-16 max-w-7xl">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div className="space-y-4 max-w-2xl">
            <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold text-primary tracking-tight">
              Exclusividade Geum
            </h1>
            <p className="text-lg text-muted-foreground font-normal max-w-xl leading-relaxed">
              Uma curadoria de imóveis selecionados pela Imobiliária Geum.
            </p>
          </div>
          <div className="hidden md:block h-px flex-grow bg-border/60 ml-8 mb-4" />
        </div>

        {imoveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/50">
            <Home className="h-16 w-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-2xl font-bold text-primary mb-2">Nenhum imóvel disponível</h2>
            <p className="text-muted-foreground">Em breve teremos novidades em nossa coleção.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {imoveis.map((imovel) => (
              <Link
                key={imovel.id}
                to={`/${imovel.codigo}`}
                className="group block h-full"
              >
                <article className="h-full bg-card border border-border/40 rounded-lg overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 flex flex-col">
                  <div className="relative aspect-[4/3] overflow-hidden bg-muted">
                    {imovel.image_urls && imovel.image_urls.length > 0 ? (
                      <img
                        src={imovel.image_urls[imovel.cover_image_index || 0]}
                        alt={imovel.endereco}
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Home className="h-12 w-12 text-muted-foreground/20" />
                      </div>
                    )}

                    {/* Badges */}
                    <div className="absolute top-4 left-4 flex gap-2">
                      <span className="px-3 py-1 bg-white/90 backdrop-blur-md text-primary text-xs font-bold uppercase tracking-wider rounded-sm shadow-sm">
                        {imovel.tipo}
                      </span>
                    </div>

                    {/* Price Tag */}
                    {imovel.valor && (
                      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 to-transparent pt-12">
                        <p className="text-white font-bold text-xl md:text-2xl">
                          {new Intl.NumberFormat('pt-BR', {
                            style: 'currency',
                            currency: 'BRL',
                            maximumFractionDigits: 0,
                          }).format(imovel.valor)}
                        </p>
                      </div>
                    )}
                  </div>

                  <CardContent className="p-6 flex flex-col flex-grow gap-4">
                    <div className="space-y-2">
                      {imovel.titulo && (
                        <h2 className="text-lg font-bold text-primary line-clamp-1">
                          {imovel.titulo}
                        </h2>
                      )}

                      <div className="flex items-start gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4 mt-1 flex-shrink-0 text-primary/60" />
                        <p className="text-sm font-medium line-clamp-2 leading-relaxed">
                          {imovel.endereco}
                        </p>
                      </div>
                    </div>

                    <div className="mt-auto pt-4 border-t border-border/40 flex items-center justify-between text-sm text-muted-foreground">
                      <div className="flex gap-4">
                        {imovel.quartos && (
                          <div className="flex items-center gap-1.5" title={`${imovel.quartos} Quartos`}>
                            <BedDouble className="h-4 w-4" />
                            <span>{imovel.quartos}</span>
                          </div>
                        )}
                        {imovel.banheiros && (
                          <div className="flex items-center gap-1.5" title={`${imovel.banheiros} Banheiros`}>
                            <Bath className="h-4 w-4" />
                            <span>{imovel.banheiros}</span>
                          </div>
                        )}
                        {imovel.area_m2 && (
                          <div className="flex items-center gap-1.5" title={`${imovel.area_m2}m²`}>
                            <Maximize className="h-4 w-4" />
                            <span>{imovel.area_m2}</span>
                          </div>
                        )}
                      </div>

                      <div className="text-primary opacity-0 group-hover:opacity-100 transition-opacity duration-300 transform translate-x-2 group-hover:translate-x-0">
                        <ArrowRight className="h-5 w-5" />
                      </div>
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-24">
            {/* Brand */}
            <div className="space-y-6">
              <div className="flex items-center gap-2">
                <img
                  src={logoWhite}
                  alt="Imobiliária Geum"
                  className="h-10 opacity-90"
                />
              </div>
              <p className="text-primary-foreground/60 text-sm leading-relaxed max-w-xs">
                Gente em primeiro lugar.
                Imobiliária Geum.
              </p>
              <p className="text-xs text-primary-foreground/40 font-bold tracking-widest uppercase">
                CRECI: 7997
              </p>
            </div>

            {/* Navigation */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Navegação</h3>
              <ul className="space-y-4 text-sm text-primary-foreground/70">
                <li><a href="#" className="hover:text-white transition-colors">Início</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Imóveis</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Sobre Nós</a></li>
                <li><a href="#" className="hover:text-white transition-colors">Contato</a></li>
              </ul>
            </div>

            {/* Contact */}
            <div>
              <h3 className="text-lg font-bold mb-6 text-white">Contato</h3>
              <div className="space-y-4 text-sm text-primary-foreground/70">
                <p className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-white/80 flex-shrink-0" />
                  <span>Rua Senador Souza Naves, 2245<br />Londrilar, Paraná</span>
                </p>
                <p className="flex items-center gap-3">
                  <Phone className="h-5 w-5 text-white/80 flex-shrink-0" />
                  <a href="tel:+554333413000" className="hover:text-white transition-colors">(43) 3341-3000</a>
                </p>
                <p className="flex items-center gap-3">
                  <Mail className="h-5 w-5 text-white/80 flex-shrink-0" />
                  <a href="mailto:contato@geumimob.com" className="hover:text-white transition-colors">contato@geumimob.com</a>
                </p>
              </div>
            </div>
          </div>

          <div className="mt-16 pt-8 border-t border-primary-foreground/10 flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-primary-foreground/40">
            <p>© {new Date().getFullYear()} Imobiliária Geum. Todos os direitos reservados.</p>
            <p>Desenvolvido por Felipe Farias.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImoveisPublic;
