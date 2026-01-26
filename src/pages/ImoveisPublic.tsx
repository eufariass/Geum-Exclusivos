import { useEffect, useState, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import type { Imovel, TipoImovel } from '@/types';
import { CardContent } from '@/components/ui/card';
import { BedDouble, Bath, Maximize, Home, MapPin, Phone, Mail, ArrowRight, Search, X, SlidersHorizontal } from 'lucide-react';
import logoBlack from '@/assets/logo-geum-black.png';
import logoWhite from '@/assets/logo-geum-white.png';
import bannerExclusividade from '@/assets/banner-exclusividade.jpg';

const tiposImovel: TipoImovel[] = ['Casa', 'Casa em condomínio', 'Apartamento', 'Terreno', 'Comercial', 'Rural'];

// Skeleton component for loading states
const PropertySkeleton = () => (
  <div className="bg-card border border-border/40 rounded-lg overflow-hidden animate-pulse">
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

const ImoveisPublic = () => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [loading, setLoading] = useState(true);
  const [imagesLoaded, setImagesLoaded] = useState<Record<string, boolean>>({});

  // Applied filter states (what's actually being used to filter)
  const [appliedFilters, setAppliedFilters] = useState({
    searchTerm: '',
    tipos: [] as TipoImovel[],
    bairro: '',
    priceMin: '',
    priceMax: '',
  });

  // Pending filter states (what user is selecting in the form)
  const [pendingFilters, setPendingFilters] = useState({
    tipos: [] as TipoImovel[],
    bairro: '',
    priceMin: '',
    priceMax: '',
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  // Track image loading for performance
  const handleImageLoad = useCallback((id: string) => {
    setImagesLoaded(prev => ({ ...prev, [id]: true }));
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

  // Filter imoveis based on applied criteria
  const filteredImoveis = useMemo(() => {
    return imoveis.filter((imovel) => {
      const imovelAny = imovel as any;

      // Search term filter (title, address, codigo) - applies immediately
      if (appliedFilters.searchTerm) {
        const search = appliedFilters.searchTerm.toLowerCase();
        const matchesSearch =
          imovel.titulo?.toLowerCase().includes(search) ||
          imovel.endereco?.toLowerCase().includes(search) ||
          imovel.codigo?.toLowerCase().includes(search) ||
          imovelAny.bairro?.toLowerCase().includes(search);
        if (!matchesSearch) return false;
      }

      // Type filter (multiple selection)
      if (appliedFilters.tipos.length > 0 && !appliedFilters.tipos.includes(imovel.tipo)) {
        return false;
      }

      // Bairro filter
      if (appliedFilters.bairro && imovelAny.bairro !== appliedFilters.bairro) {
        return false;
      }

      // Price range filter
      if (appliedFilters.priceMin) {
        const minPrice = parseFloat(appliedFilters.priceMin.replace(/\D/g, ''));
        if (imovel.valor && imovel.valor < minPrice) return false;
      }
      if (appliedFilters.priceMax) {
        const maxPrice = parseFloat(appliedFilters.priceMax.replace(/\D/g, ''));
        if (imovel.valor && imovel.valor > maxPrice) return false;
      }

      return true;
    });
  }, [imoveis, appliedFilters]);

  // Check if any filter is active
  const hasActiveFilters = appliedFilters.searchTerm || appliedFilters.tipos.length > 0 || appliedFilters.bairro || appliedFilters.priceMin || appliedFilters.priceMax;

  // Check if pending filters differ from applied
  const hasPendingChanges =
    JSON.stringify(pendingFilters.tipos) !== JSON.stringify(appliedFilters.tipos) ||
    pendingFilters.bairro !== appliedFilters.bairro ||
    pendingFilters.priceMin !== appliedFilters.priceMin ||
    pendingFilters.priceMax !== appliedFilters.priceMax;

  // Apply pending filters
  const applyFilters = () => {
    setAppliedFilters((prev) => ({
      ...prev,
      tipos: pendingFilters.tipos,
      bairro: pendingFilters.bairro,
      priceMin: pendingFilters.priceMin,
      priceMax: pendingFilters.priceMax,
    }));
    setShowFilters(false);
  };

  // Handle search (applies immediately)
  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setAppliedFilters((prev) => ({ ...prev, searchTerm: value }));
  };

  // Toggle tipo selection
  const toggleTipo = (tipo: TipoImovel) => {
    setPendingFilters((prev) => ({
      ...prev,
      tipos: prev.tipos.includes(tipo)
        ? prev.tipos.filter((t) => t !== tipo)
        : [...prev.tipos, tipo],
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setSearchTerm('');
    setPendingFilters({ tipos: [], bairro: '', priceMin: '', priceMax: '' });
    setAppliedFilters({ searchTerm: '', tipos: [], bairro: '', priceMin: '', priceMax: '' });
  };

  // Remove single applied filter
  const removeAppliedTipo = (tipo: TipoImovel) => {
    const newTipos = appliedFilters.tipos.filter((t) => t !== tipo);
    setAppliedFilters((prev) => ({ ...prev, tipos: newTipos }));
    setPendingFilters((prev) => ({ ...prev, tipos: newTipos }));
  };

  const removeAppliedBairro = () => {
    setAppliedFilters((prev) => ({ ...prev, bairro: '' }));
    setPendingFilters((prev) => ({ ...prev, bairro: '' }));
  };

  const removeAppliedPrice = (type: 'min' | 'max') => {
    if (type === 'min') {
      setAppliedFilters((prev) => ({ ...prev, priceMin: '' }));
      setPendingFilters((prev) => ({ ...prev, priceMin: '' }));
    } else {
      setAppliedFilters((prev) => ({ ...prev, priceMax: '' }));
      setPendingFilters((prev) => ({ ...prev, priceMax: '' }));
    }
  };

  // Sync pending with applied when opening filters
  const handleToggleFilters = () => {
    if (!showFilters) {
      setPendingFilters({
        tipos: appliedFilters.tipos,
        bairro: appliedFilters.bairro,
        priceMin: appliedFilters.priceMin,
        priceMax: appliedFilters.priceMax,
      });
    }
    setShowFilters(!showFilters);
  };

  // Update document title
  useEffect(() => {
    document.title = 'Imóveis Exclusivos em Londrina | Casas, Apartamentos e Terrenos | Imobiliária Geum';
  }, []);

  // Generate and inject JSON-LD structured data for properties
  useEffect(() => {
    if (filteredImoveis.length === 0) return;

    const schema = {
      "@context": "https://schema.org",
      "@type": "ItemList",
      "name": "Imóveis Exclusivos em Londrina",
      "description": "Lista de imóveis exclusivos disponíveis na Imobiliária Geum",
      "numberOfItems": filteredImoveis.length,
      "itemListElement": filteredImoveis.slice(0, 10).map((imovel, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "item": {
          "@type": "RealEstateListing",
          "name": imovel.titulo || imovel.endereco,
          "url": `https://exclusivos.geumimob.com/${imovel.codigo}`,
          "description": imovel.descricao || `${imovel.tipo} em ${imovel.endereco}`,
          "image": imovel.image_urls?.[imovel.cover_image_index || 0],
          "price": imovel.valor ? `R$ ${imovel.valor.toLocaleString('pt-BR')}` : undefined,
          "address": {
            "@type": "PostalAddress",
            "streetAddress": imovel.endereco,
            "addressLocality": "Londrina",
            "addressRegion": "PR",
            "addressCountry": "BR"
          }
        }
      }))
    };

    // Remove existing dynamic schema if present
    const existingSchema = document.getElementById('property-list-schema');
    if (existingSchema) {
      existingSchema.remove();
    }

    // Inject new schema
    const script = document.createElement('script');
    script.id = 'property-list-schema';
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(schema);
    document.head.appendChild(script);

    return () => {
      const schemaToRemove = document.getElementById('property-list-schema');
      if (schemaToRemove) {
        schemaToRemove.remove();
      }
    };
  }, [filteredImoveis]);

  // Show skeleton loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex flex-col font-sans">
        {/* Header skeleton */}
        <header className="border-b border-border/40 bg-background/95 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-6 py-5 flex items-center justify-between">
            <div className="h-10 w-32 bg-muted rounded animate-pulse" />
            <div className="hidden md:flex items-center gap-8">
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
              <div className="h-4 w-16 bg-muted rounded animate-pulse" />
            </div>
          </div>
        </header>
        <main className="flex-grow container mx-auto px-6 py-16 max-w-7xl">
          {/* Banner skeleton */}
          <div className="mb-10">
            <div className="w-full h-48 md:h-64 bg-muted rounded-xl animate-pulse" />
            <div className="h-5 w-96 max-w-full bg-muted rounded mt-6 mx-auto animate-pulse" />
          </div>
          {/* Search skeleton */}
          <div className="mb-12">
            <div className="h-12 bg-muted rounded-lg animate-pulse" />
          </div>
          {/* Grid skeleton */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 lg:gap-10">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <PropertySkeleton key={i} />
            ))}
          </div>
        </main>
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
        {/* Banner */}
        <div className="mb-10">
          <div className="relative w-full rounded-xl overflow-hidden">
            <img
              src={bannerExclusividade}
              alt="Exclusividade Geum - Imóveis exclusivos em Londrina"
              title="Imóveis Exclusivos Imobiliária Geum Londrina"
              className="w-full h-auto object-cover"
              fetchPriority="high"
            />
          </div>
          <p className="text-lg text-muted-foreground font-normal leading-relaxed mt-6 text-center">
            Uma curadoria de imóveis selecionados pela Imobiliária Geum.
          </p>
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
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full h-12 pl-12 pr-4 bg-card border border-border/60 rounded-lg text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
              />
              {searchTerm && (
                <button
                  onClick={() => handleSearch('')}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={handleToggleFilters}
              className={`h-12 px-5 flex items-center gap-2 border rounded-lg text-sm font-medium transition-all ${
                showFilters || hasActiveFilters
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'bg-card border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
              }`}
            >
              <SlidersHorizontal className="h-4 w-4" />
              <span className="hidden sm:inline">Filtros</span>
              {(appliedFilters.tipos.length > 0 || appliedFilters.bairro || appliedFilters.priceMin || appliedFilters.priceMax) && (
                <span className="h-5 w-5 flex items-center justify-center bg-white text-primary text-xs font-bold rounded-full">
                  {appliedFilters.tipos.length + (appliedFilters.bairro ? 1 : 0) + (appliedFilters.priceMin ? 1 : 0) + (appliedFilters.priceMax ? 1 : 0)}
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
                {/* Tipo de Imóvel - Checkboxes */}
                <div className="space-y-3 mb-5">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                    Tipo de Imóvel
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {tiposImovel.map((tipo) => (
                      <button
                        key={tipo}
                        onClick={() => toggleTipo(tipo)}
                        className={`px-4 py-2 rounded-lg text-sm font-medium border transition-all ${
                          pendingFilters.tipos.includes(tipo)
                            ? 'bg-primary text-primary-foreground border-primary'
                            : 'bg-background border-border/60 text-muted-foreground hover:border-primary hover:text-primary'
                        }`}
                      >
                        {tipo}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {/* Bairro */}
                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Bairro
                    </label>
                    <select
                      value={pendingFilters.bairro}
                      onChange={(e) => setPendingFilters((prev) => ({ ...prev, bairro: e.target.value }))}
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
                        value={pendingFilters.priceMin}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPendingFilters((prev) => ({ ...prev, priceMin: value }));
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
                        value={pendingFilters.priceMax}
                        onChange={(e) => {
                          const value = e.target.value.replace(/\D/g, '');
                          setPendingFilters((prev) => ({ ...prev, priceMax: value }));
                        }}
                        className="w-full h-11 pl-10 pr-3 bg-background border border-border/60 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all"
                      />
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="mt-5 pt-4 border-t border-border/40 flex flex-col sm:flex-row justify-between gap-3">
                  <button
                    onClick={clearFilters}
                    className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors flex items-center justify-center gap-1.5"
                  >
                    <X className="h-4 w-4" />
                    Limpar filtros
                  </button>
                  <button
                    onClick={applyFilters}
                    className="h-11 px-6 bg-primary text-primary-foreground text-sm font-medium rounded-lg hover:bg-primary/90 transition-colors flex items-center justify-center gap-2"
                  >
                    Aplicar Filtros
                    {hasPendingChanges && (
                      <span className="h-2 w-2 bg-white rounded-full animate-pulse" />
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Active Filters Tags & Results Count */}
          <div className="flex flex-wrap items-center gap-3">
            {hasActiveFilters && (
              <>
                {appliedFilters.tipos.map((tipo) => (
                  <span key={tipo} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {tipo}
                    <button onClick={() => removeAppliedTipo(tipo)} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
                {appliedFilters.bairro && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    {appliedFilters.bairro}
                    <button onClick={removeAppliedBairro} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.priceMin && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Mín: R$ {parseInt(appliedFilters.priceMin).toLocaleString('pt-BR')}
                    <button onClick={() => removeAppliedPrice('min')} className="hover:text-primary/70">
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                )}
                {appliedFilters.priceMax && (
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary text-xs font-medium rounded-full">
                    Máx: R$ {parseInt(appliedFilters.priceMax).toLocaleString('pt-BR')}
                    <button onClick={() => removeAppliedPrice('max')} className="hover:text-primary/70">
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
                      <>
                        {/* Skeleton placeholder while loading */}
                        {!imagesLoaded[imovel.id] && (
                          <div className="absolute inset-0 bg-muted animate-pulse" />
                        )}
                        <img
                          src={imovel.image_urls[imovel.cover_image_index || 0]}
                          alt={`${imovel.tipo} em ${imovel.endereco} - Imobiliária Geum Londrina`}
                          title={imovel.titulo || `${imovel.tipo} em ${imovel.endereco}`}
                          loading="lazy"
                          decoding="async"
                          onLoad={() => handleImageLoad(imovel.id)}
                          className={`w-full h-full object-cover transition-all duration-700 group-hover:scale-105 ${
                            imagesLoaded[imovel.id] ? 'opacity-100' : 'opacity-0'
                          }`}
                        />
                      </>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-muted">
                        <Home className="h-12 w-12 text-muted-foreground/20" aria-hidden="true" />
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
            <p>Desenvolvido por Marketing Imobiliária Geum.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ImoveisPublic;
