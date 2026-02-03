import { useState, useEffect, useRef } from 'react';
import { SiteSection, cmsService } from '@/services/cms.service';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Upload, ImageIcon } from 'lucide-react';

export const GeneralSettings = () => {
    const [heroSection, setHeroSection] = useState<SiteSection | null>(null);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const [formData, setFormData] = useState({
        title: '',
        subtitle: '',
        backgroundImage: '',
    });

    useEffect(() => {
        loadHero();
    }, []);

    const loadHero = async () => {
        try {
            setLoading(true);
            const sections = await cmsService.getSections();
            const hero = sections.find(s => s.type === 'hero');

            if (hero) {
                setHeroSection(hero);
                setFormData({
                    title: hero.title || '',
                    subtitle: hero.subtitle || '',
                    backgroundImage: hero.content?.background_image || '',
                });
            }
        } catch (error) {
            toast.error('Erro ao carregar configurações');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        if (!heroSection) return;

        try {
            setSaving(true);
            await cmsService.updateSection(heroSection.id, {
                title: formData.title,
                subtitle: formData.subtitle,
                content: {
                    ...heroSection.content,
                    background_image: formData.backgroundImage,
                }
            });
            toast.success('Configurações salvas com sucesso!');
        } catch (error) {
            toast.error('Erro ao salvar configurações');
        } finally {
            setSaving(false);
        }
    };

    const handleImageUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        try {
            setUploading(true);
            const url = await cmsService.uploadBannerImage(file); // Reusing banner upload for now
            setFormData(prev => ({ ...prev, backgroundImage: url }));
            toast.success('Imagem enviada com sucesso!');
        } catch (error) {
            toast.error('Erro ao enviar imagem');
        } finally {
            setUploading(false);
        }
    };

    if (loading) {
        return <div className="text-center py-8 text-muted-foreground">Carregando configurações...</div>;
    }

    if (!heroSection) {
        return (
            <div className="text-center py-12 border rounded-lg bg-muted/20">
                <p className="text-muted-foreground">Seção 'Hero' não encontrada. Execute a migration de seed.</p>
            </div>
        );
    }

    return (
        <div className="space-y-8 max-w-2xl">
            <div>
                <h2 className="text-lg font-semibold">Configurações Gerais</h2>
                <p className="text-sm text-muted-foreground">Gerencie o título principal e a imagem de fundo do site.</p>
            </div>

            <div className="space-y-6 border rounded-xl p-6 bg-card">
                {/* Title Fields */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <Label>Título Principal</Label>
                        <Input
                            value={formData.title}
                            onChange={e => setFormData(prev => ({ ...prev, title: e.target.value }))}
                            placeholder="Ex: Imobiliária Geum."
                        />
                    </div>

                    <div className="space-y-2">
                        <Label>Subtítulo</Label>
                        <Input
                            value={formData.subtitle}
                            onChange={e => setFormData(prev => ({ ...prev, subtitle: e.target.value }))}
                            placeholder="Ex: Encontre seu próximo imóvel."
                        />
                    </div>
                </div>

                {/* Background Image */}
                <div className="space-y-4">
                    <Label>Imagem de Fundo (Hero)</Label>

                    <div className="border-2 border-dashed rounded-lg p-4 transition-colors hover:bg-muted/50 cursor-pointer text-center relative overflow-hidden group"
                        onClick={() => fileInputRef.current?.click()}>

                        {formData.backgroundImage ? (
                            <div className="relative aspect-video w-full rounded overflow-hidden bg-black">
                                <img
                                    src={formData.backgroundImage}
                                    alt="Preview"
                                    className="object-cover w-full h-full opacity-70"
                                />
                                <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="flex flex-col items-center text-white">
                                        <Upload className="h-8 w-8 mb-2" />
                                        <span className="font-medium">Alterar Imagem</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="aspect-video w-full flex flex-col items-center justify-center text-muted-foreground py-12">
                                <ImageIcon className="h-10 w-10 mb-3 opacity-50" />
                                <span className="font-medium">Clique para fazer upload</span>
                                <span className="text-xs mt-1">Recomendado: 1920x1080px (JPG/PNG)</span>
                            </div>
                        )}

                        <input
                            ref={fileInputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={handleImageUpload}
                            disabled={uploading}
                        />
                    </div>
                    {uploading && <div className="text-sm text-muted-foreground animate-pulse">Enviando imagem...</div>}
                </div>

                {/* Actions */}
                <div className="flex justify-end pt-4 border-t">
                    <Button onClick={handleSave} disabled={saving || uploading}>
                        {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Salvar Alterações
                    </Button>
                </div>
            </div>
        </div>
    );
};
