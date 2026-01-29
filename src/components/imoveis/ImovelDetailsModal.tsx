import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Textarea } from '@/components/ui/textarea';
import {
    MapPin,
    Home,
    BedDouble,
    Bath,
    Car,
    Ruler,
    Calendar,
    DollarSign,
    User,
    Share2,
    Clock,
    MessageSquare,
    History,
    Send,
    Building2,
    X
} from 'lucide-react';
import type { Imovel, ImovelComment, ImovelHistory } from '@/types';
import { formatCurrency } from '@/lib/dateUtils';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface ImovelDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    imovel: Imovel | null;
}

export const ImovelDetailsModal = ({ isOpen, onClose, imovel }: ImovelDetailsModalProps) => {
    const { user } = useAuth();
    const [activeTab, setActiveTab] = useState('detalhes');
    const [comments, setComments] = useState<ImovelComment[]>([]);
    const [history, setHistory] = useState<ImovelHistory[]>([]);
    const [newComment, setNewComment] = useState('');
    const [loadingComments, setLoadingComments] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(false);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);

    useEffect(() => {
        if (isOpen && imovel) {
            loadComments();
            loadHistory();
            setSelectedImageIndex(0);
        }
    }, [isOpen, imovel]);

    const loadComments = async () => {
        if (!imovel) return;
        setLoadingComments(true);
        try {
            const data = await supabaseStorageService.getImovelComments(imovel.id);
            setComments(data);
        } catch (error) {
            console.error('Erro ao carregar comentários:', error);
        } finally {
            setLoadingComments(false);
        }
    };

    const loadHistory = async () => {
        if (!imovel) return;
        setLoadingHistory(true);
        try {
            const data = await supabaseStorageService.getImovelHistory(imovel.id);
            setHistory(data);
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
        } finally {
            setLoadingHistory(false);
        }
    };

    const handleAddComment = async () => {
        if (!imovel || !newComment.trim() || !user) return;

        try {
            await supabaseStorageService.addImovelComment({
                imovel_id: imovel.id,
                content: newComment,
                created_by: user.id,
                created_by_name: user.email?.split('@')[0] || 'Usuário',
            });
            setNewComment('');
            loadComments();
            toast.success('Comentário adicionado!');

            // Log history
            await supabaseStorageService.logImovelHistory({
                imovel_id: imovel.id,
                action: 'comment_added',
                description: 'Adicionou um comentário',
                created_by: user.id,
                created_by_name: user.email?.split('@')[0] || 'Usuário',
            });
            loadHistory();
        } catch (error) {
            console.error('Erro ao adicionar comentário:', error);
            toast.error('Erro ao adicionar comentário');
        }
    };

    if (!imovel) return null;

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="max-w-5xl h-[90vh] p-0 gap-0 bg-background/95 backdrop-blur-xl border-border/40 overflow-hidden flex flex-col md:flex-row rounded-3xl">

                {/* Left Column - Image Gallery & Key Info */}
                <div className="w-full md:w-1/2 bg-muted/30 flex flex-col h-full border-r border-border/40">
                    <div className="relative flex-1 bg-black/5 overflow-hidden group">
                        {imovel.image_urls && imovel.image_urls.length > 0 ? (
                            <img
                                src={imovel.image_urls[selectedImageIndex]}
                                alt={imovel.titulo}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                            />
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-muted">
                                <Home className="h-24 w-24 text-muted-foreground/20" />
                            </div>
                        )}

                        <div className="absolute top-4 left-4 flex gap-2">
                            <Badge className="bg-background/90 text-foreground backdrop-blur-md shadow-sm pointer-events-none data-[type=Venda]:bg-blue-500/10 data-[type=Venda]:text-blue-700 data-[type=Locação]:bg-green-500/10 data-[type=Locação]:text-green-700">
                                {imovel.tipo}
                            </Badge>
                            {imovel.plataformas_anuncio?.map(p => (
                                <Badge key={p} variant="secondary" className="bg-white/90 text-xs backdrop-blur-md">
                                    {p}
                                </Badge>
                            ))}
                        </div>
                    </div>

                    {/* Thumbnails */}
                    {imovel.image_urls && imovel.image_urls.length > 1 && (
                        <div className="p-4 overflow-x-auto whitespace-nowrap scrollbar-hide bg-background/50 backdrop-blur-sm border-t border-border/40">
                            <div className="flex gap-2">
                                {imovel.image_urls.map((url, idx) => (
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
                        <h2 className="text-2xl font-bold leading-tight mb-2">{imovel.titulo || 'Imóvel sem título'}</h2>
                        <div className="flex items-start gap-2 text-muted-foreground mb-4">
                            <MapPin className="h-4 w-4 mt-1 flex-shrink-0" />
                            <p className="text-sm">{imovel.endereco}</p>
                        </div>

                        <div className="flex items-baseline gap-1">
                            <span className="text-sm text-muted-foreground font-medium">Valor:</span>
                            <span className="text-3xl font-bold tracking-tight text-primary">
                                {imovel.valor ? formatCurrency(imovel.valor) : 'Sob Consulta'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Right Column - Tabs & Details */}
                <div className="w-full md:w-1/2 flex flex-col h-full bg-background/60 backdrop-blur-xl">
                    <div className="flex items-center justify-between p-4 border-b border-border/40">
                        <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                                {imovel.codigo.slice(0, 2)}
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider font-bold">Código</p>
                                <p className="font-mono font-medium">{imovel.codigo}</p>
                            </div>
                        </div>
                        <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full hover:bg-muted/50">
                            <X className="h-5 w-5" />
                        </Button>
                    </div>

                    <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1 flex flex-col overflow-hidden">
                        <div className="px-6 pt-4">
                            <TabsList className="grid w-full grid-cols-3 bg-muted/50 p-1 rounded-2xl">
                                <TabsTrigger value="detalhes" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Detalhes</TabsTrigger>
                                <TabsTrigger value="comentarios" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Comentários</TabsTrigger>
                                <TabsTrigger value="historico" className="rounded-xl data-[state=active]:bg-background data-[state=active]:shadow-sm">Histórico</TabsTrigger>
                            </TabsList>
                        </div>

                        <div className="flex-1 overflow-hidden p-6">
                            <ScrollArea className="h-full pr-4">
                                <TabsContent value="detalhes" className="mt-0 space-y-6 focus-visible:ring-0">

                                    {/* Features Grid */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <BedDouble className="h-4 w-4" />
                                                <span className="text-xs font-medium uppercase">Quartos</span>
                                            </div>
                                            <p className="text-xl font-bold">{imovel.quartos || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Bath className="h-4 w-4" />
                                                <span className="text-xs font-medium uppercase">Banheiros</span>
                                            </div>
                                            <p className="text-xl font-bold">{imovel.banheiros || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Car className="h-4 w-4" />
                                                <span className="text-xs font-medium uppercase">Vagas</span>
                                            </div>
                                            <p className="text-xl font-bold">{imovel.vagas || '-'}</p>
                                        </div>
                                        <div className="p-4 rounded-2xl bg-secondary/30 border border-border/50 flex flex-col gap-1">
                                            <div className="flex items-center gap-2 text-muted-foreground">
                                                <Ruler className="h-4 w-4" />
                                                <span className="text-xs font-medium uppercase">Área Total</span>
                                            </div>
                                            <p className="text-xl font-bold">{imovel.area_m2 ? `${imovel.area_m2}m²` : '-'}</p>
                                        </div>
                                    </div>

                                    <Separator className="bg-border/50" />

                                    {/* Description */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <Building2 className="h-4 w-4 text-primary" />
                                            Descrição
                                        </h3>
                                        <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                                            {imovel.descricao || 'Nenhuma descrição fornecida.'}
                                        </p>
                                    </div>

                                    <Separator className="bg-border/50" />

                                    {/* Owner Info */}
                                    <div className="space-y-3">
                                        <h3 className="font-semibold flex items-center gap-2">
                                            <User className="h-4 w-4 text-primary" />
                                            Proprietário
                                        </h3>
                                        <div className="flex items-center gap-3 p-3 rounded-2xl bg-muted/30 border border-border/50">
                                            <Avatar className="h-10 w-10 border border-border">
                                                <AvatarFallback className="bg-primary/5 text-primary">
                                                    {imovel.cliente.charAt(0)}
                                                </AvatarFallback>
                                            </Avatar>
                                            <div>
                                                <p className="font-medium">{imovel.cliente}</p>
                                                <p className="text-xs text-muted-foreground">Cliente Proprietário</p>
                                            </div>
                                        </div>
                                    </div>

                                </TabsContent>

                                <TabsContent value="comentarios" className="mt-0 h-full flex flex-col focus-visible:ring-0">
                                    <div className="space-y-4 mb-6">
                                        {loadingComments ? (
                                            <p className="text-center text-muted-foreground text-sm py-8">Carregando comentários...</p>
                                        ) : comments.length === 0 ? (
                                            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                                                <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                                <p className="text-sm text-muted-foreground">Nenhum comentário ainda.</p>
                                            </div>
                                        ) : (
                                            <div className="space-y-4">
                                                {comments.map((comment) => (
                                                    <div key={comment.id} className="flex gap-3 group">
                                                        <Avatar className="h-8 w-8 mt-1 border border-border">
                                                            <AvatarFallback className="bg-primary/5 text-xs">
                                                                {comment.created_by_name?.charAt(0) || 'U'}
                                                            </AvatarFallback>
                                                        </Avatar>
                                                        <div className="flex-1">
                                                            <div className="bg-muted/40 p-3 rounded-2xl rounded-tl-none border border-border/30 group-hover:bg-muted/60 transition-colors">
                                                                <div className="flex justify-between items-center mb-1">
                                                                    <span className="text-xs font-semibold">{comment.created_by_name}</span>
                                                                    <span className="text-[10px] text-muted-foreground">{new Date(comment.created_at).toLocaleDateString()}</span>
                                                                </div>
                                                                <p className="text-sm text-foreground/90">{comment.content}</p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>

                                    {/* Input Area - Fixed at bottom of tab content in a real scenario, but here inside scroll for simplicity in this modal layout */}
                                    <div className="mt-auto pt-4 sticky bottom-0 bg-background/95 backdrop-blur-md pb-2">
                                        <div className="flex gap-2">
                                            <Textarea
                                                placeholder="Adicione um comentário..."
                                                value={newComment}
                                                onChange={(e) => setNewComment(e.target.value)}
                                                className="resize-none min-h-[80px] rounded-xl bg-muted/30 focus:bg-background transition-colors"
                                            />
                                            <Button
                                                size="icon"
                                                onClick={handleAddComment}
                                                disabled={!newComment.trim()}
                                                className="h-auto w-12 rounded-xl"
                                            >
                                                <Send className="h-4 w-4" />
                                            </Button>
                                        </div>
                                    </div>
                                </TabsContent>

                                <TabsContent value="historico" className="mt-0 focus-visible:ring-0">
                                    <div className="space-y-6 pl-2">
                                        {loadingHistory ? (
                                            <p className="text-center text-muted-foreground text-sm py-8">Carregando histórico...</p>
                                        ) : history.length === 0 ? (
                                            <div className="text-center py-12 px-4 rounded-2xl border border-dashed border-border/60 bg-muted/20">
                                                <History className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                                                <p className="text-sm text-muted-foreground">Nenhum registro de histórico.</p>
                                            </div>
                                        ) : (
                                            <div className="relative border-l border-border/50 ml-3 space-y-8 py-2">
                                                {history.map((item) => (
                                                    <div key={item.id} className="relative pl-6">
                                                        <div className="absolute -left-[5px] top-1 h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-background" />
                                                        <div className="flex flex-col gap-1">
                                                            <span className="text-xs font-medium text-muted-foreground">
                                                                {new Date(item.created_at).toLocaleString()}
                                                            </span>
                                                            <p className="text-sm font-medium">{item.description}</p>
                                                            <div className="flex items-center gap-1.5 mt-1">
                                                                <Avatar className="h-4 w-4">
                                                                    <AvatarFallback className="text-[8px]">{item.created_by_name?.charAt(0)}</AvatarFallback>
                                                                </Avatar>
                                                                <span className="text-xs text-muted-foreground">por {item.created_by_name}</span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                </TabsContent>
                            </ScrollArea>
                        </div>
                    </Tabs>
                </div>
            </DialogContent>
        </Dialog>
    );
};
