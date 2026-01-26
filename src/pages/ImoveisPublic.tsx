import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel, TipoImovel } from '@/types';
import { Card, CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Car, Maximize, Home, MapPin, Phone, Mail, ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';

const tiposImovel: TipoImovel[] = ['Casa', 'Casa em condomínio', 'Apartamento', 'Terreno', 'Comercial', 'Rural'];

const ImoveisPublic = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);

  // Filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTipo, setSelectedTipo] = useState<TipoImovel | ''>('');
  const [selectedBairro, setSelectedBairro] = useState('');
  const [priceRange, setPriceRange] = useState<{ min: string; max: string }>({ min: '', max: '' });
  const [showFilters, setShowFilters] = useState(false);

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

  // Extract unique bairros from imoveis
  const bairros = useMemo(() => {
    const bairroSet = new Set<string>();
    imoveis.forEach((imovel) => {
      const imovelAny = imovel as any;
      if (imovelAny.bairro) {
        bairroSet.add(imovelAny.bairro);
      }
    });
    return Array.from(bairroSet).sort();
  }, [imoveis]);

  // Filter imoveis based on criteria
  const filteredImoveis = useMemo(() => {
    return imoveis.filter((imovel) => {
      const imovelAny = imovel as any;

      // Search term filter (title, address, codigo)
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        const matchesSearch =
          imovel.titulo?.toLowerCase().includes(search) ||
          imovel.endereco?.toLowerCase().includes(search) ||
          imovel.codigo?.toLowerCase().includes(search) ||
          imovelAny.bairro?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Type filter
      if (selectedTipo && imovel.tipo !== selectedTipo) {
        return false;
      }

      // Bairro filter
      if (selectedBairro && imovelAny.bairro !== selectedBairro) {
        return false;
      }

      // Price range filter
      if (priceRange.min) {
        const minPrice = parseFloat(priceRange.min.replace(/\D/g, ''));
        if (imovel.valor && imovel.valor < minPrice) return false;
      }
      if (priceRange.max) {
        const maxPrice = parseFloat(priceRange.max.replace(/\D/g, ''));
        if (imovel.valor && imovel.valor > maxPrice) return false;
      }

      return true;
    });
  }, [imoveis, searchTerm, selectedTipo, selectedBairro, priceRange]);

  // Check if any filter is active
  const hasActiveFilters = searchTerm || selectedTipo || selectedBairro || priceRange.min || priceRange.max;

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTipo('');
    setSelectedBairro('');
    setPriceRange({ min: '', max: '' });
  };

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
        <div className="flex flex-col md:flex-row justify-between items-end mb-10 gap-6">
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

        {/* Filter Section */}
        <div className="mb-12 space-y-4">
          {/* Search Bar */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Buscar por nome, endereço ou código..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-card border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`h-12 px-5 flex items-center gap-2 border rounded-lg text-sm font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {hasActiveFilters && (
                <span className="h-5 w-5 flex items-center justify-center bg-white text-primary text-xs font-bold rounded-full">
                  {[selectedTipo, selectedBairro, priceRange.min, priceRange.max].filter(Boolean).length}
                </span>
              )}
            </button>
          </div>

          {/* Expandable Filters */}
          <div className={`grid gap-4 overflow-hidden transition-all duration-300 ${
            showFilters ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'
          }`}>
            <div className="overflow-hidden">
              <div className="bg-card border border-border/60 rounded-lg p-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                  {/* Tipo de Imóvel */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Tipo de Imóvel
                    </label>
                    <select
                      value={selectedTipo}
                      onChange={(e) => setSelectedTipo(e.target.value as TipoImovel | '')}
                      className="w-full h-11 px-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Todos os tipos</option>
                      {tiposImovel.map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {tipo}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Bairro */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Bairro
                    </label>
                    <select
                      value={selectedBairro}
                      onChange={(e) => setSelectedBairro(e.target.value)}
                      className="w-full h-11 px-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                    >
                      <option value="">Todos os bairros</option>
                      {bairros.map((bairro) => (
                        <option key={bairro} value={bairro}>
                          {bairro}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Preço Mínimo */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Preço Mínimo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <input
                        type="text"
                        placeholder="0"
                        value={priceRange.min}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPriceRange((prev) => ({ ...prev, min: value }));
                        }}
                        className="w-full h-11 pl-10 pr-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>

                  {/* Preço Máximo */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Preço Máximo
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground text-sm">R$</span>
                      <input
                        type="text"
                        placeholder="Sem limite"
                        value={priceRange.max}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPriceRange((prev) => ({ ...prev, max: value }));
                        }}
                        className="w-full h-11 pl-10 pr-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Clear Filters */}
                {hasActiveFilters && (
                  <div className="mt-4 pt-4 border-t border-border/40 flex justify-end">
                    <button
                      onClick={clearFilters}
                      className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center gap-1.5"
                    >
                      <X className="h-4 w-4" />
                      Limpar filtros
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Active Filters Tags & Results Count */}
          <div className="flex flex-wrap items-center gap-3">
            {hasActiveFilters && (
              <>
                {selectedTipo && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {selectedTipo}
                    <button onClick={() => setSelectedTipo('')} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {selectedBairro && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {selectedBairro}
                    <button onClick={() => setSelectedBairro('')} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange.min && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Mín: R$ {parseInt(priceRange.min).toLocaleString('pt-BR')}
                    <button onClick={() => setPriceRange((prev) => ({ ...prev, min: '' }))} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {priceRange.max && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Máx: R$ {parseInt(priceRange.max).toLocaleString('pt-BR')}
                    <button onClick={() => setPriceRange((prev) => ({ ...prev, max: '' }))} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
              </>
            )}
            <span className="text-sm text-muted-foreground ml-auto">
              {filteredImoveis.length} {filteredImoveis.length === 1 ? 'imóvel encontrado' : 'imóveis encontrados'}
            </span>
          </div>
        </div>

        {filteredImoveis.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center border border-dashed border-border rounded-xl bg-card/50">
            <Home className="h-16 w-16 text-muted-foreground/20 mb-6" />
            <h2 className="text-2xl font-bold text-primary mb-2">
              {hasActiveFilters ? 'Nenhum imóvel encontrado' : 'Nenhum imóvel disponível'}
            </h2>
            <p className="text-muted-foreground">
              {hasActiveFilters
                ? 'Tente ajustar os filtros para encontrar mais opções.'
                : 'Em breve teremos novidades em nossa coleção.'}
            </p>
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors"
              >
                Limpar filtros
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {filteredImoveis.map((imovel) => (
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
