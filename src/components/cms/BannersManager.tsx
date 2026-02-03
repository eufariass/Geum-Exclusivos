import { useState, useEffect } from 'react';
import { SiteBanner, cmsService } from '@/services/cms.service';
import { Button } from '@/components/ui/button';
import { Plus, Trash, GripVertical, Image as ImageIcon, ExternalLink, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface SortableBannerProps {
    banner: SiteBanner;
    onEdit: (banner: SiteBanner) => void;
    onDelete: (id: string) => void;
}

const SortableBanner = ({ banner, onEdit, onDelete }: SortableBannerProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: banner.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className="flex items-center gap-4 p-4 bg-card border rounded-lg group"
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="h-16 w-24 relative rounded-md overflow-hidden bg-muted flex-shrink-0">
                {banner.image_url ? (
                    <img src={banner.image_url} alt={banner.title || 'Banner'} className="h-full w-full object-cover" />
                ) : (
                    <div className="h-full w-full flex items-center justify-center">
                        <ImageIcon className="h-6 w-6 text-muted-foreground" />
                    </div>
                )}
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{banner.title || 'Sem título'}</h4>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    {banner.active ? (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                            Ativo
                        </span>
                    ) : (
                        <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                            Inativo
                        </span>
                    )}
                    {banner.link_url && (
                        <span className="flex items-center gap-1 truncated max-w-[200px]">
                            <ExternalLink className="h-3 w-3" />
                            {banner.link_url}
                        </span>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="icon" onClick={() => onEdit(banner)}>
                    <Pencil className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="icon" className="text-destructive hover:text-destructive" onClick={() => onDelete(banner.id)}>
                    <Trash className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const BannersManager = () => {
    const [banners, setBanners] = useState<SiteBanner[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingBanner, setEditingBanner] = useState<SiteBanner | null>(null);

    // Form State
    const [formData, setFormData] = useState({
        title: '',
        image_url: '',
        link_url: '',
        active: true,
        external_link: false,
    });
    const [uploading, setUploading] = useState(false);

    useEffect(() => {
        loadBanners();
    }, []);

    const loadBanners = async () => {
        try {
            setLoading(true);
            const data = await cmsService.getBanners();
            setBanners(data);
        } catch (error) {
            toast.error('Erro ao carregar banners');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setBanners((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Save new order
                cmsService.reorderBanners(newOrder.map(b => b.id)).catch(() => {
                    toast.error('Erro ao salvar ordem dos banners');
                });

                return newOrder;
            });
        }
    };

    const handleEdit = (banner: SiteBanner) => {
        setEditingBanner(banner);
        setFormData({
            title: banner.title || '',
            image_url: banner.image_url,
            link_url: banner.link_url || '',
            active: banner.active,
            external_link: banner.external_link,
        });
        setIsModalOpen(true);
    };

    const handleAddNew = () => {
        setEditingBanner(null);
        setFormData({
            title: '',
            image_url: '',
            link_url: '',
            active: true,
            external_link: false,
        });
        setIsModalOpen(true);
    };

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const url = await cmsService.uploadBannerImage(file);
            setFormData(prev => ({ ...prev, image_url: url }));
            toast.success('Imagem enviada com sucesso');
        } catch (error) {
            toast.error('Erro ao enviar imagem');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!formData.image_url) {
            toast.error('Imagem é obrigatória');
            return;
        }

        try {
            setUploading(true); // Reuse uploading state for saving

            const bannerData = {
                title: formData.title,
                image_url: formData.image_url,
                link_url: formData.link_url,
                active: formData.active,
                external_link: formData.external_link,
                // Optional fields defaulted
                desktop_image_url: null,
                mobile_image_url: null,
                order_index: editingBanner ? editingBanner.order_index : banners.length,
            };

            if (editingBanner) {
                await cmsService.updateBanner(editingBanner.id, bannerData);
                toast.success('Banner atualizado!');
            } else {
                await cmsService.createBanner(bannerData as any);
                toast.success('Banner criado!');
            }

            setIsModalOpen(false);
            loadBanners();
        } catch (error) {
            toast.error('Erro ao salvar banner');
        } finally {
            setUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm('Tem certeza que deseja excluir este banner?')) return;

        try {
            await cmsService.deleteBanner(id);
            toast.success('Banner excluído');
            loadBanners();
        } catch (error) {
            toast.error('Erro ao excluir banner');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-lg font-semibold">Banners da Home</h2>
                    <p className="text-sm text-muted-foreground">Gerencie os banners principais do site</p>
                </div>
                <Button onClick={handleAddNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Novo Banner
                </Button>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={banners.map(b => b.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {banners.map((banner) => (
                            <SortableBanner
                                key={banner.id}
                                banner={banner}
                                onEdit={handleEdit}
                                onDelete={handleDelete}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>{editingBanner ? 'Editar Banner' : 'Novo Banner'}</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Imagem</Label>
                            <div className="flex items-center gap-4">
                                {formData.image_url && (
                                    <img src={formData.image_url} alt="Preview" className="h-20 w-32 object-cover rounded-md border" />
                                )}
                                <Input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                    disabled={uploading}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <Label>Título (Opcional)</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Lançamento Exclusivo"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Link de destino (Opcional)</Label>
                            <Input
                                value={formData.link_url}
                                onChange={e => setFormData(prev => ({ ...prev, link_url: e.target.value }))}
                                placeholder="https://..."
                            />
                        </div>

                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="active"
                                    checked={formData.active}
                                    onCheckedChange={checked => setFormData(prev => ({ ...prev, active: checked }))}
                                />
                                <Label htmlFor="active">Ativo</Label>
                            </div>

                            <div className="flex items-center space-x-2">
                                <Switch
                                    id="external"
                                    checked={formData.external_link}
                                    onCheckedChange={checked => setFormData(prev => ({ ...prev, external_link: checked }))}
                                />
                                <Label htmlFor="external">Link Externo</Label>
                            </div>
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave} disabled={uploading}>
                            {uploading ? 'Salvando...' : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
};
