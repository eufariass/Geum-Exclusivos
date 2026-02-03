import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { cmsService, SiteSection } from '@/services/cms.service';
import { Loader2, X } from 'lucide-react';

interface SectionFilterDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    section: SiteSection;
    onSave: (filters: any) => Promise<void>;
}

export const SectionFilterDialog = ({ open, onOpenChange, section, onSave }: SectionFilterDialogProps) => {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [options, setOptions] = useState<{
        neighborhoods: string[];
        propertyTypes: string[];
        publicationTypes: string[];
    }>({ neighborhoods: [], propertyTypes: [], publicationTypes: [] });

    const [filters, setFilters] = useState<any>({});

    useEffect(() => {
        if (open) {
            loadOptions();
            setFilters(section.content?.filters || {});
        }
    }, [open, section]);

    const loadOptions = async () => {
        try {
            setLoading(true);
            const data = await cmsService.getFilterOptions();
            setOptions({
                neighborhoods: data.neighborhoods as string[],
                propertyTypes: data.propertyTypes as string[],
                publicationTypes: data.publicationTypes as string[],
            });
        } catch (error) {
            console.error('Failed to load options', error);
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        try {
            setSaving(true);
            await onSave(filters);
            onOpenChange(false);
        } catch (error) {
            console.error(error);
        } finally {
            setSaving(false);
        }
    };

    const toggleArrayItem = (key: string, value: string) => {
        setFilters((prev: any) => {
            const current = prev[key] || [];
            if (current.includes(value)) {
                return { ...prev, [key]: current.filter((item: string) => item !== value) };
            } else {
                return { ...prev, [key]: [...current, value] };
            }
        });
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Filtros da Seção: {section.title}</DialogTitle>
                </DialogHeader>

                {loading ? (
                    <div className="flex items-center justify-center py-8"><Loader2 className="animate-spin" /></div>
                ) : (
                    <ScrollArea className="flex-1 pr-4">
                        <div className="space-y-6 py-4">

                            {/* Featured */}
                            <div className="flex items-center space-x-2">
                                <Checkbox
                                    id="featured"
                                    checked={filters.featured}
                                    onCheckedChange={(checked) => setFilters((prev: any) => ({ ...prev, featured: checked }))}
                                />
                                <Label htmlFor="featured">Mostrar apenas destaques</Label>
                            </div>

                            {/* Publication Types (Launch vs Standard) */}
                            <div className="space-y-3">
                                <Label>Tipo de Publicação</Label>
                                <div className="flex flex-wrap gap-2">
                                    {options.publicationTypes.map(type => (
                                        <Badge
                                            key={type}
                                            variant={filters.publication_type === type ? 'default' : 'outline'}
                                            className="cursor-pointer"
                                            onClick={() => setFilters((prev: any) => ({
                                                ...prev,
                                                publication_type: prev.publication_type === type ? undefined : type
                                            }))}
                                        >
                                            {type}
                                        </Badge>
                                    ))}
                                </div>
                            </div>

                            {/* Neighborhoods */}
                            <div className="space-y-3">
                                <Label>Bairros ({filters.neighborhoods?.length || 0})</Label>
                                <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto p-2 border rounded">
                                    {options.neighborhoods.map(neighborhood => {
                                        const isSelected = filters.neighborhoods?.includes(neighborhood);
                                        return (
                                            <Badge
                                                key={neighborhood}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className="cursor-pointer hover:bg-primary/90"
                                                onClick={() => toggleArrayItem('neighborhoods', neighborhood)}
                                            >
                                                {neighborhood}
                                                {isSelected && <X className="ml-1 h-3 w-3" />}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Property Types */}
                            <div className="space-y-3">
                                <Label>Tipos de Imóvel ({filters.property_types?.length || 0})</Label>
                                <div className="flex flex-wrap gap-2">
                                    {options.propertyTypes.map(type => {
                                        const isSelected = filters.property_types?.includes(type);
                                        return (
                                            <Badge
                                                key={type}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className="cursor-pointer hover:bg-primary/90"
                                                onClick={() => toggleArrayItem('property_types', type)}
                                            >
                                                {type}
                                                {isSelected && <X className="ml-1 h-3 w-3" />}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Features (Hardcoded common ones for now as fetching all distinct features is heavy) */}
                            <div className="space-y-3">
                                <Label>Características (Contém)</Label>
                                <div className="flex flex-wrap gap-2">
                                    {['Condomínio', 'Lançamento', 'Piscina', 'Churrasqueira'].map(feature => {
                                        const isSelected = filters.features?.includes(feature);
                                        return (
                                            <Badge
                                                key={feature}
                                                variant={isSelected ? 'default' : 'outline'}
                                                className="cursor-pointer hover:bg-primary/90"
                                                onClick={() => toggleArrayItem('features', feature)}
                                            >
                                                {feature}
                                                {isSelected && <X className="ml-1 h-3 w-3" />}
                                            </Badge>
                                        );
                                    })}
                                </div>
                            </div>

                        </div>
                    </ScrollArea>
                )}

                <DialogFooter className="mt-4">
                    <Button variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                    <Button onClick={handleSave} disabled={saving}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Filtros
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
