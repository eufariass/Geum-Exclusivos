import { Search, X } from 'lucide-react';

export interface FiltersState {
    search: string;
    city: string;
    neighborhood: string;
    transactionType: string;
    minPrice: string;
    maxPrice: string;
    bedrooms: string;
}

interface ImovelArboFiltersProps {
    filters: FiltersState;
    onChange: (filters: FiltersState) => void;
    cities: string[];
    neighborhoods: string[];
}

export function ImovelArboFilters({
    filters,
    onChange,
    cities,
    neighborhoods,
}: ImovelArboFiltersProps) {
    const handleChange = (key: keyof FiltersState, value: string) => {
        onChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onChange({
            search: '',
            city: '',
            neighborhood: '',
            transactionType: '',
            minPrice: '',
            maxPrice: '',
            bedrooms: '',
        });
    };

    const hasActiveFilters = Object.values(filters).some(Boolean);

    return (
        <div className="bg-card rounded-2xl border border-border p-4 space-y-4">
            {/* Search */}
            <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                    type="text"
                    placeholder="Buscar por título, endereço ou código..."
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none"
                />
            </div>

            {/* Filters Row */}
            <div className="flex flex-wrap gap-3">
                {/* City */}
                <select
                    value={filters.city}
                    onChange={(e) => handleChange('city', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none min-w-[140px]"
                >
                    <option value="">Todas as Cidades</option>
                    {cities.map((city) => (
                        <option key={city} value={city}>
                            {city}
                        </option>
                    ))}
                </select>

                {/* Neighborhood */}
                <select
                    value={filters.neighborhood}
                    onChange={(e) => handleChange('neighborhood', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none min-w-[140px]"
                >
                    <option value="">Todos os Bairros</option>
                    {neighborhoods.map((neighborhood) => (
                        <option key={neighborhood} value={neighborhood}>
                            {neighborhood}
                        </option>
                    ))}
                </select>

                {/* Transaction Type */}
                <select
                    value={filters.transactionType}
                    onChange={(e) => handleChange('transactionType', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none min-w-[120px]"
                >
                    <option value="">Venda e Locação</option>
                    <option value="For Sale">Venda</option>
                    <option value="For Rent">Locação</option>
                </select>

                {/* Price Range */}
                <input
                    type="number"
                    placeholder="Preço mín."
                    value={filters.minPrice}
                    onChange={(e) => handleChange('minPrice', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none w-[120px]"
                />
                <input
                    type="number"
                    placeholder="Preço máx."
                    value={filters.maxPrice}
                    onChange={(e) => handleChange('maxPrice', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm placeholder:text-muted-foreground focus:ring-2 focus:ring-primary/20 focus:outline-none w-[120px]"
                />

                {/* Bedrooms */}
                <select
                    value={filters.bedrooms}
                    onChange={(e) => handleChange('bedrooms', e.target.value)}
                    className="px-3 py-2 rounded-xl bg-muted border-0 text-sm focus:ring-2 focus:ring-primary/20 focus:outline-none min-w-[120px]"
                >
                    <option value="">Quartos</option>
                    <option value="1">1+</option>
                    <option value="2">2+</option>
                    <option value="3">3+</option>
                    <option value="4">4+</option>
                </select>

                {/* Clear Filters */}
                {hasActiveFilters && (
                    <button
                        onClick={clearFilters}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors text-sm"
                    >
                        <X className="h-4 w-4" />
                        Limpar filtros
                    </button>
                )}
            </div>
        </div>
    );
}
