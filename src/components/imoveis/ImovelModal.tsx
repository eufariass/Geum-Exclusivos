import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import type { Imovel, TipoImovel } from '@/types';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { ImageUpload } from './ImageUpload';

interface ImovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imovel: Imovel) => void;
  editingImovel?: Imovel | null;
}

const tiposImovel: TipoImovel[] = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural'];

export const ImovelModal = ({ isOpen, onClose, onSave, editingImovel }: ImovelModalProps) => {
  const [formData, setFormData] = useState({
    codigo: '',
    cliente: '',
    endereco: '',
    tipo: 'Casa' as TipoImovel,
    valor: '',
    descricao: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [removedImageIndices, setRemovedImageIndices] = useState<number[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingImovel) {
      setFormData({
        codigo: editingImovel.codigo,
        cliente: editingImovel.cliente,
        endereco: editingImovel.endereco,
        tipo: editingImovel.tipo,
        valor: editingImovel.valor ? String(editingImovel.valor) : '',
        descricao: editingImovel.descricao || '',
      });
      setCoverImageIndex(editingImovel.cover_image_index || 0);
    } else {
      setFormData({
        codigo: '',
        cliente: '',
        endereco: '',
        tipo: 'Casa',
        valor: '',
        descricao: '',
      });
      setCoverImageIndex(0);
    }
    setErrors({});
    setImageFiles([]);
    setRemovedImageIndices([]);
  }, [editingImovel, isOpen]);

  const formatCurrencyInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const numberValue = parseInt(numbers) / 100;
    return numberValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleValorChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrencyInput(e.target.value);
    setFormData((prev) => ({ ...prev, valor: formatted }));
  };

  const parseValor = (formatted: string): number | undefined => {
    if (!formatted) return undefined;
    const numbers = formatted.replace(/\D/g, '');
    return parseInt(numbers) / 100;
  };

  const validate = async (): Promise<boolean> => {
    const newErrors: Record<string, string> = {};

    if (!formData.codigo.trim()) newErrors.codigo = 'Código é obrigatório';
    if (!formData.cliente.trim()) newErrors.cliente = 'Cliente é obrigatório';
    if (!formData.endereco.trim()) newErrors.endereco = 'Endereço é obrigatório';

    // Check unique codigo
    if (formData.codigo.trim()) {
      const imoveis = await supabaseStorageService.getImoveis();
      const exists = imoveis.some(
        (i) => i.codigo === formData.codigo.trim() && (!editingImovel || i.id !== editingImovel.id)
      );
      if (exists) newErrors.codigo = 'Código já existe';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!(await validate()) || isSubmitting) return;

    setIsSubmitting(true);
    try {
      let imageUrls = editingImovel?.image_urls || [];

      // Remover imagens marcadas para exclusão
      if (removedImageIndices.length > 0 && editingImovel) {
        const imagesToDelete = removedImageIndices
          .map(index => editingImovel.image_urls?.[index])
          .filter(url => url) as string[];
        
        if (imagesToDelete.length > 0) {
          await supabaseStorageService.deleteImages(imagesToDelete);
        }
        
        imageUrls = imageUrls.filter((_, index) => !removedImageIndices.includes(index));
      }

      // Upload de novas imagens se selecionadas
      if (imageFiles.length > 0) {
        const tempId = editingImovel?.id || `temp-${Date.now()}`;
        const newUrls = await supabaseStorageService.uploadImages(imageFiles, tempId);
        imageUrls = [...imageUrls, ...newUrls];
      }

      const imovelData = {
        codigo: formData.codigo.trim(),
        cliente: formData.cliente.trim(),
        endereco: formData.endereco.trim(),
        tipo: formData.tipo,
        valor: parseValor(formData.valor),
        descricao: formData.descricao.trim() || undefined,
        image_urls: imageUrls,
        cover_image_index: coverImageIndex,
        data_cadastro: editingImovel?.data_cadastro || new Date().toISOString(),
      };

      if (editingImovel) {
        await supabaseStorageService.updateImovel(editingImovel.id, imovelData);
      } else {
        await supabaseStorageService.addImovel(imovelData);
      }

      onSave({} as Imovel); // Trigger refresh
      onClose();
    } catch (error) {
      console.error('Erro ao salvar imóvel:', error);
      alert('Erro ao salvar imóvel. Tente novamente.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{editingImovel ? 'Editar Imóvel' : 'Cadastrar Imóvel'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto px-1">
          <div>
            <Label htmlFor="codigo">Código *</Label>
            <Input
              id="codigo"
              value={formData.codigo}
              onChange={(e) => setFormData((prev) => ({ ...prev, codigo: e.target.value }))}
              className={errors.codigo ? 'border-destructive' : ''}
            />
            {errors.codigo && <p className="text-xs text-destructive mt-1">{errors.codigo}</p>}
          </div>

          <div>
            <Label htmlFor="cliente">Cliente *</Label>
            <Input
              id="cliente"
              value={formData.cliente}
              onChange={(e) => setFormData((prev) => ({ ...prev, cliente: e.target.value }))}
              className={errors.cliente ? 'border-destructive' : ''}
            />
            {errors.cliente && <p className="text-xs text-destructive mt-1">{errors.cliente}</p>}
          </div>

          <div>
            <Label htmlFor="endereco">Endereço *</Label>
            <Input
              id="endereco"
              value={formData.endereco}
              onChange={(e) => setFormData((prev) => ({ ...prev, endereco: e.target.value }))}
              className={errors.endereco ? 'border-destructive' : ''}
            />
            {errors.endereco && <p className="text-xs text-destructive mt-1">{errors.endereco}</p>}
          </div>

          <div>
            <Label htmlFor="tipo">Tipo *</Label>
            <Select value={formData.tipo} onValueChange={(value) => setFormData((prev) => ({ ...prev, tipo: value as TipoImovel }))}>
              <SelectTrigger id="tipo">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {tiposImovel.map((tipo) => (
                  <SelectItem key={tipo} value={tipo}>
                    {tipo}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="valor">Valor (opcional)</Label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">R$</span>
              <Input
                id="valor"
                value={formData.valor}
                onChange={handleValorChange}
                placeholder="0,00"
                className="pl-10"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="descricao">Descrição do Imóvel</Label>
            <Textarea
              id="descricao"
              value={formData.descricao}
              onChange={(e) => setFormData((prev) => ({ ...prev, descricao: e.target.value }))}
              placeholder="Texto de apresentação do imóvel, principais destaques..."
              className="min-h-[100px] resize-none"
            />
          </div>

          <div>
            <Label>Imagens do Imóvel (até 5 fotos de 15MB cada)</Label>
            <p className="text-xs text-muted-foreground mb-2">Clique em uma foto para defini-la como capa</p>
            <ImageUpload
              currentImages={editingImovel?.image_urls}
              coverIndex={coverImageIndex}
              onImagesSelect={(files) => setImageFiles([...imageFiles, ...files])}
              onRemoveImage={(index) => {
                if (editingImovel && index < (editingImovel.image_urls?.length || 0)) {
                  setRemovedImageIndices([...removedImageIndices, index]);
                  if (coverImageIndex === index) {
                    setCoverImageIndex(0);
                  } else if (coverImageIndex > index) {
                    setCoverImageIndex(coverImageIndex - 1);
                  }
                } else {
                  const newIndex = index - (editingImovel?.image_urls?.length || 0);
                  setImageFiles(imageFiles.filter((_, i) => i !== newIndex));
                }
              }}
              onSetCover={(index) => setCoverImageIndex(index)}
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button type="button" variant="outline" onClick={onClose} className="flex-1" disabled={isSubmitting}>
              Cancelar
            </Button>
            <Button type="submit" className="flex-1" disabled={isSubmitting}>
              {isSubmitting ? 'Salvando...' : editingImovel ? 'Salvar' : 'Cadastrar'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
