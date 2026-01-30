import type { ImovelArbo } from '@/types';
import { MapPin, Bed, Bath, Car, Maximize, ExternalLink } from 'lucide-react';

interface ImovelArboCardProps {
    imovel: ImovelArbo;
    onClick?: () => void;
}

export function ImovelArboCard({ imovel, onClick }: ImovelArboCardProps) {
    const formatPrice = (price?: number) => {
        if (!price) return 'Sob consulta';
        return new Intl.NumberFormat('pt-BR', {
            style: 'currency',
            currency: 'BRL',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(price);
    };

    const transactionLabel = imovel.transaction_type === 'For Sale' ? 'Venda' : 'Locação';
    const transactionColor = imovel.transaction_type === 'For Sale'
        ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400'
        : 'bg-blue-500/10 text-blue-600 dark:text-blue-400';

    return (
        <div
            className={`bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg transition-shadow group ${onClick ? 'cursor-pointer' : ''}`}
            onClick={onClick}
        >
            {/* Image */}
            <div className="relative h-48 bg-muted overflow-hidden">
                {imovel.primary_image ? (
                    <img
                        src={imovel.primary_image}
                        alt={imovel.title || 'Imóvel'}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                    />
                ) : (
                    <div className="w-full h-full flex items-center justify-center">
                        <Maximize className="h-12 w-12 text-muted-foreground/30" />
                    </div>
                )}

                {/* Transaction Type Badge */}
                <span className={`absolute top-3 left-3 px-3 py-1 rounded-full text-xs font-semibold ${transactionColor}`}>
                    {transactionLabel}
                </span>

                {/* Featured Badge */}
                {imovel.featured && (
                    <span className="absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400">
                        Destaque
                    </span>
                )}

                {/* Photo count */}
                {imovel.images && imovel.images.length > 1 && (
                    <span className="absolute bottom-3 right-3 px-2 py-1 rounded-lg text-xs font-medium bg-black/60 text-white">
                        {imovel.images.length} fotos
                    </span>
                )}
            </div>

            {/* Content */}
            <div className="p-4 space-y-3">
                {/* Title */}
                <h3 className="font-semibold text-foreground line-clamp-2 min-h-[2.5rem]">
                    {imovel.title || imovel.property_type || 'Imóvel'}
                </h3>

                {/* Location */}
                <div className="flex items-start gap-2 text-sm text-muted-foreground">
                    <MapPin className="h-4 w-4 mt-0.5 shrink-0" />
                    <span className="line-clamp-1">
                        {[imovel.neighborhood, imovel.city].filter(Boolean).join(', ') || imovel.address}
                    </span>
                </div>

                {/* Features */}
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    {imovel.bedrooms !== null && imovel.bedrooms !== undefined && imovel.bedrooms > 0 && (
                        <div className="flex items-center gap-1">
                            <Bed className="h-4 w-4" />
                            <span>{imovel.bedrooms}</span>
                        </div>
                    )}
                    {imovel.bathrooms !== null && imovel.bathrooms !== undefined && imovel.bathrooms > 0 && (
                        <div className="flex items-center gap-1">
                            <Bath className="h-4 w-4" />
                            <span>{imovel.bathrooms}</span>
                        </div>
                    )}
                    {imovel.garage !== null && imovel.garage !== undefined && imovel.garage > 0 && (
                        <div className="flex items-center gap-1">
                            <Car className="h-4 w-4" />
                            <span>{imovel.garage}</span>
                        </div>
                    )}
                    {imovel.living_area !== null && imovel.living_area !== undefined && imovel.living_area > 0 && (
                        <div className="flex items-center gap-1">
                            <Maximize className="h-4 w-4" />
                            <span>{imovel.living_area}m²</span>
                        </div>
                    )}
                </div>

                {/* Price */}
                <div className="pt-2 border-t border-border flex items-center justify-between">
                    <span className="text-lg font-bold text-foreground">
                        {formatPrice(imovel.price)}
                    </span>

                    {imovel.detail_url && (
                        <a
                            href={imovel.detail_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1 text-sm text-primary hover:underline"
                        >
                            <ExternalLink className="h-4 w-4" />
                            Ver no Arbo
                        </a>
                    )}
                </div>

                {/* Code */}
                <div className="text-xs text-muted-foreground">
                    Código: {imovel.listing_id}
                </div>
            </div>
        </div>
    );
}
