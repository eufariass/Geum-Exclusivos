import { useState, useEffect } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import {
    MapPin,
    Home,
    BedDouble,
    Bath,
    Car,
    Ruler,
    Download,
    X,
    Maximize2,
    Minimize2,
    Calendar,
    ExternalLink
} from 'lucide-react';
import type { ImovelArbo } from '@/types';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface ImovelArboDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    imovel: ImovelArbo | null;
}

export const ImovelArboDetailsModal = ({ isOpen, onClose, imovel }: ImovelArboDetailsModalProps) => {
    const [activeTab, setActiveTab] = useState('detalhes');
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [isFullScreen, setIsFullScreen] = useState(false);
    const [isLightboxOpen, setIsLightboxOpen] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);

    // Normalize images: use images array or fallback to primary_image
    const images = imovel?.images && imovel.images.length > 0
        ? imovel.images
        : imovel?.primary_image
            ? [imovel.primary_image]
            : [];

    useEffect(() => {
        if (isOpen && imovel) {
            setSelectedImageIndex(0);
        }
    }, [isOpen, imovel]);

    const handleDownloadPhotos = async () => {
        if (!images || images.length === 0) return;

        setIsDownloading(true);
        try {
            const zip = new JSZip();

            // Promise.all to fetch all images
            // Note: Fetching external images might fail due to CORS. 
            // If Arbo images allow CORS, this works. Otherwise, we might need a proxy or simple open in new tabs.
            // For now, let's try assuming they are accessible or at least try. 
            // If CORS fails, we catch error.

            const promises = images.map(async (url, i) => {
                try {
                    const response = await fetch(url);
                    if (!response.ok) throw new Error('Network error');
                    const blob = await response.blob();
                    const ext = url.split('.').pop()?.split('?')[0] || 'jpg';
                    zip.file(`foto-${i + 1}.${ext}`, blob);
                } catch (e) {
                    console.warn(`Failed to download image ${url}`, e);
                    // Continue with other images
                }
            });

            await Promise.all(promises);

            if (Object.keys(zip.files).length === 0) {
                toast.error('Não foi possível baixar as imagens (possível bloqueio CORS).');
                return;
            }

            const content = await zip.generateAsync({ type: 'blob' });

            const link = document.createElement('a');
            link.href = URL.createObjectURL(content);
            link.download = `arbo-${imovel?.listing_id || 'imovel'}.zip`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);

            toast.success('Download iniciado!');
        } catch (error) {
            console.error('Erro ao baixar fotos:', error);
            toast.error('Erro ao baixar fotos.');
        } finally {
            setIsDownloading(false);
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

    if (!imovel) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className={`p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/40 overflow-hidden flex flex-col md:flex-row transition-all duration-300 [&>button]:hidden ${isFullScreen ? 'w-screen h-screen max-w-none rounded-none' : 'max-w-5xl h-[90vh] rounded-3xl'}`}>

                {/* Left Column - Image Gallery & Key Info */}
                <div className={`w-full md:w-1/2 bg-muted/30 flex flex-col h-full border-r border-border/40 relative ${isFullScreen ? 'md:w-[60%]' : ''}`}>

                    {/* Main Image Area */}
                    <div className="relative flex-1 bg-black/5 overflow-hidden group">
                        {images.length > 0 ? (
                            <img
                                src={images[selectedImageIndex]}
                                alt={imovel.title}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 cursor-zoom-in"
                                onClick={() => setIsLightboxOpen(true)}
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Home className="h-24 w-24 text-muted-foreground/20" />
                            </div>
                        )}

                        {/* Badges Overlay */}
                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className={`backdrop-blur-md shadow-sm pointer-events-none ${imovel.transaction_type === 'For Sale'
                                    ? 'bg-emerald-500/90 text-white'
                                    : 'bg-blue-500/90 text-white'
                                }`}>
                                {imovel.transaction_type === 'For Sale' ? 'Venda' : 'Locação'}
                            </Badge>
                            {imovel.featured && (
                                <Badge className="bg-amber-500/90 text-white backdrop-blur-md">
                                    Destaque
                                </Badge>
                            )}
                        </div>

                        {/* Action Buttons Overlay */}
                        <div className="absolute top-4 right-4 flex gap-2">
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                                onClick={handleDownloadPhotos}
                                disabled={isDownloading}
                                title="Baixar todas as fotos"
                            >
                                <Download className={`h-4 w-4 ${isDownloading ? 'animate-pulse' : ''}`} />
                            </Button>
                            <Button
                                variant="secondary"
                                size="icon"
                                className="h-8 w-8 rounded-full bg-background/80 backdrop-blur"
                                onClick={() => setIsLightboxOpen(true)}
                                title="Ver em tela cheia"
                            >
                                <Maximize2 className="h-4 w-4" />
                            </Button>
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {images.length > 1 && (
                        <div className="p-4 overflow-x-auto whitespace-nowrap scrollbar-hide bg-background/50 backdrop-blur-sm border-t border-border/40">
                            <div className="flex gap-2">
                                {images.map((url, idx) => (
                                    <button
                                        key={idx}
                                        onClick={() => setSelectedImageIndex(idx)}
                                        className={`relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all ${selectedImageIndex === idx
                                            ? 'border-primary ring-2 ring-primary/20 scale-105 z-10'
                                            : 'border-transparent opacity-70 hover:opacity-100 hover:scale-105'
                                            }`}
                                    >
                                        <img src={url} alt="" className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="p-6">
                        <h2 className="text-2xl font-bold leading-tight mb-2 opacity-90">{imovel.title || imovel.property_type || 'Imóvel sem título'}</h2>
                        <div className="flex items-start gap-2 text-muted-foreground mb-4 opacity-80">
                            <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                            <p className="text-sm">{imovel.address} - {imovel.neighborhood}, {imovel.city}</p>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-sm text-muted-foreground font-medium opacity-80">Valor:</span>
                            <span className="text-3xl font-bold tracking-tight text-primary">
                                {formatPrice(imovel.price)}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Tabs & Details */}
                <div className={`w-full flex flex-col h-full bg-background/60 backdrop-blur-xl ${isFullScreen ? 'md:w-[40%]' : 'md:w-1/2'}`}>
                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {imovel.listing_id.slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Código</p>
                                <p className="font-mono font-medium">{imovel.listing_id}</p>
                            </div>
                        </div>

                        <div className="flex items-center gap-1">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setIsFullScreen(!isFullScreen)}
                                className="rounded-full hover:bg-muted/50 hidden md:flex"
                                title={isFullScreen ? "Restaurar" : "Tela Cheia"}
                            >
                                {isFullScreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
                            </Button>
                            <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
                                <X className="h-5 w-5" />
                            </Button>
                        </div>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-1 bg-muted/50 p-1 rounded-2xl">
                                <TabsTrigger value="detalhes" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Detalhes</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden p-6 pb-0">
                            <TabsContent value="detalhes" className="mt-0 space-y-6 focus-visible:ring-0 h-full overflow-y-auto pr-4 pb-6">
                                {/* Features Grid */}
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <BedDouble className="h-4 w-4" />
                                            <span className="text-xs font-medium uppercase">Quartos</span>
                                        </div>
                                        <p className="text-xl font-bold">{imovel.bedrooms || '-'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Bath className="h-4 w-4" />
                                            <span className="text-xs font-medium uppercase">Banheiros</span>
                                        </div>
                                        <p className="text-xl font-bold">{imovel.bathrooms || '-'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Car className="h-4 w-4" />
                                            <span className="text-xs font-medium uppercase">Vagas</span>
                                        </div>
                                        <p className="text-xl font-bold">{imovel.garage || '-'}</p>
                                    </div>
                                    <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                            <Ruler className="h-4 w-4" />
                                            <span className="text-xs font-medium uppercase">Área Útil</span>
                                        </div>
                                        <p className="text-xl font-bold">{imovel.living_area ? `${imovel.living_area}m²` : '-'}</p>
                                    </div>
                                </div>

                                <Separator className="bg-border/50 my-6" />

                                {/* Description */}
                                <div className="space-y-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <ExternalLink className="h-4 w-4 text-primary" />
                                        Descrição
                                    </h3>
                                    <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                        {imovel.description || 'Nenhuma descrição fornecida.'}
                                    </p>
                                </div>

                                <Separator className="bg-border/50 my-6" />

                                {/* Sync Info */}
                                <div className="space-y-3 pb-4">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-primary" />
                                        Informações de Sincronização
                                    </h3>
                                    <div className="bg-muted/30 p-4 rounded-xl border border-border/50 space-y-2 text-sm">
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Última atualização (Arbo):</span>
                                            <span className="font-medium">{imovel.last_update_date ? new Date(imovel.last_update_date).toLocaleDateString() : 'N/A'}</span>
                                        </div>
                                        <div className="flex justify-between">
                                            <span className="text-muted-foreground">Sincronizado em:</span>
                                            <span className="font-medium">{imovel.synced_at ? new Date(imovel.synced_at).toLocaleString() : 'N/A'}</span>
                                        </div>
                                        {imovel.detail_url && (
                                            <div className="pt-2 mt-2 border-t border-border/50">
                                                <a href={imovel.detail_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1">
                                                    Ver original no Arbo <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            </TabsContent>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>

            {/* Lightbox for Full Screen Image */}
            {isLightboxOpen && (
                <div
                    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center p-4 animate-in fade-in duration-200"
                    onClick={() => setIsLightboxOpen(false)}
                >
                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute top-4 right-4 text-white hover:bg-white/10 rounded-full h-12 w-12 z-[110]"
                        onClick={() => setIsLightboxOpen(false)}
                    >
                        <X className="h-6 w-6" />
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full h-12 w-12 z-[110]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex((prev) => (prev > 0 ? prev - 1 : (images.length || 1) - 1));
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-left"><path d="m15 18-6-6 6-6" /></svg>
                    </Button>

                    <Button
                        variant="ghost"
                        size="icon"
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/10 rounded-full h-12 w-12 z-[110]"
                        onClick={(e) => {
                            e.stopPropagation();
                            setSelectedImageIndex((prev) => (prev < (images.length || 1) - 1 ? prev + 1 : 0));
                        }}
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-chevron-right"><path d="m9 18 6-6-6-6" /></svg>
                    </Button>

                    <img
                        src={images[selectedImageIndex]}
                        alt="Full screen view"
                        className="max-w-full max-h-[90vh] object-contain rounded-md shadow-2xl z-[105]"
                        onClick={(e) => e.stopPropagation()}
                    />

                    {images.length > 1 && (
                        <div
                            className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 p-2 bg-black/50 backdrop-blur-md rounded-full max-w-[90vw] overflow-x-auto z-[110]"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {images.map((url, idx) => (
                                <button
                                    key={idx}
                                    onClick={() => setSelectedImageIndex(idx)}
                                    className={`w-12 h-12 rounded-lg overflow-hidden border-2 transition-all ${selectedImageIndex === idx ? 'border-primary opacity-100' : 'border-transparent opacity-50 hover:opacity-100'
                                        }`}
                                >
                                    <img src={url} alt="" className="w-full h-full object-cover" />
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </Dialog>
    );
};
