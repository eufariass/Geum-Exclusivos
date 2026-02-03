import { useState, useEffect } from 'react';
import { SiteSection, cmsService } from '@/services/cms.service';
import { Button } from '@/components/ui/button';
import { GripVertical, Pencil } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { DndContext, closestCenter, DragEndEvent } from '@dnd-kit/core';
import { arrayMove, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { SectionFilterDialog } from './SectionFilterDialog';
import { SlidersHorizontal } from 'lucide-react';

interface SortableSectionProps {
    section: SiteSection;
    onEdit: (section: SiteSection) => void;
    onToggleActive: (section: SiteSection) => void;
    onEditFilters: (section: SiteSection) => void;
}

const SortableSection = ({ section, onEdit, onToggleActive, onEditFilters }: SortableSectionProps) => {
    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
    } = useSortable({ id: section.id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
    };

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`flex items-center gap-4 p-4 border rounded-lg group transition-colors ${section.active ? 'bg-card' : 'bg-muted/50 opacity-70'}`}
        >
            <div {...attributes} {...listeners} className="cursor-grab text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
            </div>

            <div className="flex-1 min-w-0">
                <h4 className="font-medium truncate">{section.title || 'Seção sem título'}</h4>
                <p className="text-sm text-muted-foreground truncate">{section.subtitle || section.type}</p>
            </div>

            <div className="flex items-center gap-4">
                {section.type === 'property_list' && (
                    <Button variant="outline" size="sm" onClick={() => onEditFilters(section)} className="gap-2">
                        <SlidersHorizontal className="h-3.5 w-3.5" />
                        Filtros
                    </Button>
                )}

                <div className="flex items-center gap-2">
                    <Switch
                        checked={section.active}
                        onCheckedChange={() => onToggleActive(section)}
                    />
                    <span className="text-sm text-muted-foreground w-12 text-center">
                        {section.active ? 'Visível' : 'Oculto'}
                    </span>
                </div>

                <Button variant="ghost" size="icon" onClick={() => onEdit(section)}>
                    <Pencil className="h-4 w-4" />
                </Button>
            </div>
        </div>
    );
};

export const SectionsManager = () => {
    const [sections, setSections] = useState<SiteSection[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isFiltersOpen, setIsFiltersOpen] = useState(false);
    const [editingSection, setEditingSection] = useState<SiteSection | null>(null);
    const [formData, setFormData] = useState({ title: '', subtitle: '' });

    useEffect(() => {
        loadSections();
    }, []);

    const loadSections = async () => {
        try {
            setLoading(true);
            const data = await cmsService.getSections();
            // Filter out hero, as it is managed in General Settings
            setSections(data.filter(s => s.type !== 'hero'));
        } catch (error) {
            toast.error('Erro ao carregar seções');
        } finally {
            setLoading(false);
        }
    };

    const handleDragEnd = async (event: DragEndEvent) => {
        const { active, over } = event;

        if (active.id !== over?.id) {
            setSections((items) => {
                const oldIndex = items.findIndex((i) => i.id === active.id);
                const newIndex = items.findIndex((i) => i.id === over?.id);
                const newOrder = arrayMove(items, oldIndex, newIndex);

                // Save new order
                cmsService.reorderSections(newOrder.map(s => s.id)).catch(() => {
                    toast.error('Erro ao salvar ordem das seções');
                });

                return newOrder;
            });
        }
    };

    const handleEdit = (section: SiteSection) => {
        setEditingSection(section);
        setFormData({
            title: section.title || '',
            subtitle: section.subtitle || '',
        });
        setIsModalOpen(true);
    };

    const handleEditFilters = (section: SiteSection) => {
        setEditingSection(section);
        setIsFiltersOpen(true);
    };

    const handleSaveFilters = async (filters: any) => {
        if (!editingSection) return;

        try {
            const updated = await cmsService.updateSection(editingSection.id, {
                content: { ...editingSection.content, filters }
            });

            setSections(prev => prev.map(s => s.id === updated.id ? updated : s));
            toast.success('Filtros atualizados com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar filtros');
            throw error;
        }
    };

    const handleToggleActive = async (section: SiteSection) => {
        try {
            const newStatus = !section.active;

            // Optimistic update
            setSections(prev => prev.map(s =>
                s.id === section.id ? { ...s, active: newStatus } : s
            ));

            await cmsService.updateSection(section.id, { active: newStatus });
            toast.success(newStatus ? 'Seção ativada' : 'Seção ocultada');
        } catch (error) {
            toast.error('Erro ao atualizar status');
            loadSections(); // Revert
        }
    };

    const handleSave = async () => {
        if (!editingSection) return;

        try {
            const updated = await cmsService.updateSection(editingSection.id, {
                title: formData.title,
                subtitle: formData.subtitle,
            });

            setSections(prev => prev.map(s =>
                s.id === updated.id ? updated : s
            ));

            toast.success('Seção atualizada!');
            setIsModalOpen(false);
        } catch (error) {
            toast.error('Erro ao salvar seção');
        }
    };

    if (loading && sections.length === 0) {
        return <div className="text-center py-8 text-muted-foreground">Carregando seções...</div>;
    }

    return (
        <div className="space-y-6">
            <div>
                <h2 className="text-lg font-semibold">Seções da Home</h2>
                <p className="text-sm text-muted-foreground">Reordene e gerencie a visibilidade das seções do site</p>
            </div>

            <DndContext collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                <SortableContext items={sections.map(s => s.id)} strategy={verticalListSortingStrategy}>
                    <div className="space-y-3">
                        {sections.map((section) => (
                            <SortableSection
                                key={section.id}
                                section={section}
                                onEdit={handleEdit}
                                onToggleActive={handleToggleActive}
                                onEditFilters={handleEditFilters}
                            />
                        ))}
                    </div>
                </SortableContext>
            </DndContext>

            {sections.length === 0 && (
                <div className="text-center py-12 border rounded-lg bg-muted/20">
                    <p className="text-muted-foreground">Nenhuma seção configurada no banco de dados.</p>
                </div>
            )}

            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Editar Seção</DialogTitle>
                    </DialogHeader>

                    <div className="space-y-4 py-4">
                        <div className="space-y-2">
                            <Label>Título</Label>
                            <Input
                                value={formData.title}
                                onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                                placeholder="Ex: Lançamentos"
                            />
                        </div>

                        <div className="space-y-2">
                            <Label>Subtítulo</Label>
                            <Input
                                value={formData.subtitle}
                                onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                                placeholder="Ex: Confira as novidades"
                            />
                        </div>
                    </div>

                    <DialogFooter>
                        <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancelar</Button>
                        <Button onClick={handleSave}>Salvar</Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {editingSection && (
                <SectionFilterDialog
                    open={isFiltersOpen}
                    onOpenChange={setIsFiltersOpen}
                    section={editingSection}
                    onSave={handleSaveFilters}
                />
            )}
        </div>
    );
};
