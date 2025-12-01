import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Separator } from '@/components/ui/separator';
import type { Imovel, TipoImovel } from '@/types';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { ImageUpload } from './ImageUpload';
import { useAuth } from '@/contexts/AuthContext';
import { Download } from 'lucide-react';
import { toast } from 'sonner';
import JSZip from 'jszip';

interface ImovelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (imovel: Imovel) => void;
  editingImovel?: Imovel | null;
}

const tiposImovel: TipoImovel[] = ['Casa', 'Apartamento', 'Terreno', 'Comercial', 'Rural'];

export const ImovelModal = ({ isOpen, onClose, onSave, editingImovel }: ImovelModalProps) => {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    codigo: '',
    titulo: '',
    cliente: '',
    cep: '',
    rua: '',
    numero: '',
    bairro: '',
    cidade: 'Londrina',
    estado: 'PR',
    endereco: '',
    tipo: 'Casa' as TipoImovel,
    valor: '',
    descricao: '',
    quartos: '',
    banheiros: '',
    area_m2: '',
    vagas: '',
    tipos_disponiveis: ['Venda', 'Locação'] as ('Venda' | 'Locação')[],
    plataformas_anuncio: [] as string[],
  });
  const [loadingCep, setLoadingCep] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [imageFiles, setImageFiles] = useState<File[]>([]);
  const [removedImageIndices, setRemovedImageIndices] = useState<number[]>([]);
  const [coverImageIndex, setCoverImageIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [imageOrder, setImageOrder] = useState<string[]>([]);
  const [zipUrl, setZipUrl] = useState<string | null>(null);
  const [zipName, setZipName] = useState<string | null>(null);

  useEffect(() => {
    // Limpa URL de ZIP sempre que o modal abrir/fechar ou o imóvel mudar
    setZipUrl((prev) => {
      if (prev) {
        window.URL.revokeObjectURL(prev);
      }
      return null;
    });
    setZipName(null);

    if (editingImovel) {
      const imovelAny = editingImovel as any;
      setFormData({
        codigo: editingImovel.codigo,
        titulo: editingImovel.titulo || '',
        cliente: editingImovel.cliente,
        cep: imovelAny.cep || '',
        rua: imovelAny.rua || '',
        numero: imovelAny.numero || '',
        bairro: imovelAny.bairro || '',
        cidade: imovelAny.cidade || 'Londrina',
        estado: imovelAny.estado || 'PR',
        endereco: editingImovel.endereco,
        tipo: editingImovel.tipo,
        valor: editingImovel.valor ? editingImovel.valor.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : '',
        descricao: editingImovel.descricao || '',
        quartos: editingImovel.quartos ? String(editingImovel.quartos) : '',
        banheiros: editingImovel.banheiros ? String(editingImovel.banheiros) : '',
        area_m2: editingImovel.area_m2 ? String(editingImovel.area_m2) : '',
        vagas: editingImovel.vagas ? String(editingImovel.vagas) : '',
        tipos_disponiveis: editingImovel.tipos_disponiveis || ['Venda', 'Locação'],
        plataformas_anuncio: editingImovel.plataformas_anuncio || [],
      });
      setCoverImageIndex(editingImovel.cover_image_index || 0);
      setImageOrder(editingImovel.image_urls || []);
    } else {
      setFormData({
        codigo: '',
        titulo: '',
        cliente: '',
        cep: '',
        rua: '',
        numero: '',
        bairro: '',
        cidade: 'Londrina',
        estado: 'PR',
        endereco: '',
        tipo: 'Casa',
        valor: '',
        descricao: '',
        quartos: '',
        banheiros: '',
        area_m2: '',
        vagas: '',
        tipos_disponiveis: ['Venda', 'Locação'],
        plataformas_anuncio: [],
      });
      setCoverImageIndex(0);
      setImageOrder([]);
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

  const buscarCEP = async (cep: string) => {
    const cleanCEP = cep.replace(/\D/g, '');
    
    if (cleanCEP.length !== 8) {
      return;
    }

    setLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cleanCEP}/json/`);
      const data = await response.json();

      if (data && !data.erro) {
        setFormData(prev => ({
          ...prev,
          rua: data.logradouro || '',
          bairro: data.bairro || '',
          cidade: data.localidade || 'Londrina',
          estado: data.uf || 'PR',
        }));
      }
    } catch (error) {
      console.error('Erro ao buscar CEP:', error);
    } finally {
      setLoadingCep(false);
    }
  };

  const handleCepChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, '');
    const formatted = value.replace(/^(\d{5})(\d)/, '$1-$2');
    setFormData(prev => ({ ...prev, cep: formatted }));
    
    if (value.length === 8) {
      buscarCEP(value);
    }
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

  const handleDownloadImages = async () => {
    if (!editingImovel?.image_urls || editingImovel.image_urls.length === 0) {
      toast.error('Nenhuma imagem disponível para download');
      return;
    }

    // Limpa ZIP anterior, se existir
    setZipUrl((prev) => {
      if (prev) {
        window.URL.revokeObjectURL(prev);
      }
      return null;
    });
    setZipName(null);

    toast.info('Preparando download das imagens...');

    try {
      const zip = new JSZip();

      // Download todas as imagens e adiciona ao ZIP
      for (let i = 0; i < editingImovel.image_urls.length; i++) {
        const imageUrl = editingImovel.image_urls[i];
        
        try {
          const response = await fetch(imageUrl, {
            mode: 'cors',
          });
          
          if (!response.ok) {
            throw new Error(`Erro ao baixar imagem ${i + 1}`);
          }
          
          const arrayBuffer = await response.arrayBuffer();
          
          // Adiciona ao ZIP com nome formatado
          zip.file(`${editingImovel.codigo}_foto_${i + 1}.jpg`, arrayBuffer);
        } catch (imgError) {
          console.error(`Erro na imagem ${i + 1}:`, imgError);
          toast.error(`Erro ao processar imagem ${i + 1}`);
        }
      }

      // Gera o arquivo ZIP
      toast.info('Gerando arquivo ZIP...');
      const nomeArquivo = `${editingImovel.codigo}_fotos.zip`;
      const zipBlob = await zip.generateAsync({ 
        type: 'blob',
        compression: 'DEFLATE',
        compressionOptions: {
          level: 6,
        },
      });

      const url = window.URL.createObjectURL(zipBlob);
      setZipUrl(url);
      setZipName(nomeArquivo);

      toast.success('ZIP gerado! Clique no botão "Baixar ZIP" para fazer o download.');
    } catch (error) {
      console.error('Erro ao baixar imagens:', error);
      toast.error('Erro ao gerar arquivo ZIP');
    }
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

      // Use reordered images if available
      if (imageOrder.length > 0) {
        imageUrls = imageOrder;
      }

      // Montar endereço completo
      const enderecoCompleto = formData.numero 
        ? `${formData.rua}, ${formData.numero}${formData.bairro ? ` - ${formData.bairro}` : ''}`
        : formData.rua;

      const imovelData = {
        codigo: formData.codigo.trim(),
        titulo: formData.titulo.trim() || undefined,
        cliente: formData.cliente.trim(),
        cep: formData.cep.trim() || undefined,
        rua: formData.rua.trim() || undefined,
        numero: formData.numero.trim() || undefined,
        bairro: formData.bairro.trim() || undefined,
        cidade: formData.cidade.trim() || undefined,
        estado: formData.estado.trim() || undefined,
        endereco: enderecoCompleto,
        tipo: formData.tipo,
        valor: parseValor(formData.valor),
        descricao: formData.descricao.trim() || undefined,
        quartos: formData.quartos ? parseInt(formData.quartos) : undefined,
        banheiros: formData.banheiros ? parseInt(formData.banheiros) : undefined,
        area_m2: formData.area_m2 ? parseFloat(formData.area_m2) : undefined,
        vagas: formData.vagas ? parseInt(formData.vagas) : undefined,
        image_urls: imageUrls,
        cover_image_index: coverImageIndex,
        tipos_disponiveis: formData.tipos_disponiveis,
        plataformas_anuncio: formData.plataformas_anuncio,
        data_cadastro: editingImovel?.data_cadastro || new Date().toISOString(),
        updated_by: user?.id,
        ...(editingImovel ? {} : { created_by: user?.id }),
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
            <Label htmlFor="titulo">Título do Imóvel</Label>
            <Input
              id="titulo"
              value={formData.titulo}
              onChange={(e) => setFormData((prev) => ({ ...prev, titulo: e.target.value }))}
              placeholder="Ex: Apartamento Moderno no Centro"
            />
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
            <Label htmlFor="cep">CEP *</Label>
            <Input
              id="cep"
              value={formData.cep}
              onChange={handleCepChange}
              placeholder="00000-000"
              maxLength={9}
              disabled={loadingCep}
            />
            {loadingCep && <p className="text-xs text-muted-foreground mt-1">Buscando endereço...</p>}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="rua">Rua/Avenida</Label>
              <Input
                id="rua"
                value={formData.rua}
                onChange={(e) => setFormData((prev) => ({ ...prev, rua: e.target.value }))}
                placeholder="Preenchido automaticamente pelo CEP"
              />
            </div>

            <div className="col-span-2 sm:col-span-1">
              <Label htmlFor="numero">Número *</Label>
              <Input
                id="numero"
                value={formData.numero}
                onChange={(e) => setFormData((prev) => ({ ...prev, numero: e.target.value }))}
                placeholder="Ex: 123, S/N"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="bairro">Bairro</Label>
              <Input
                id="bairro"
                value={formData.bairro}
                onChange={(e) => setFormData((prev) => ({ ...prev, bairro: e.target.value }))}
                placeholder="Preenchido automaticamente pelo CEP"
              />
            </div>

            <div>
              <Label htmlFor="cidade">Cidade</Label>
              <Input
                id="cidade"
                value={formData.cidade}
                onChange={(e) => setFormData((prev) => ({ ...prev, cidade: e.target.value }))}
              />
            </div>
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
            <Label>Tipos de Negócio Disponíveis *</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tipo-venda"
                  checked={formData.tipos_disponiveis.includes('Venda')}
                  onChange={(e) => {
                    const newTipos = e.target.checked
                      ? [...formData.tipos_disponiveis, 'Venda']
                      : formData.tipos_disponiveis.filter(t => t !== 'Venda');
                    setFormData((prev) => ({ ...prev, tipos_disponiveis: newTipos as ('Venda' | 'Locação')[] }));
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="tipo-venda" className="cursor-pointer">Venda</Label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="tipo-locacao"
                  checked={formData.tipos_disponiveis.includes('Locação')}
                  onChange={(e) => {
                    const newTipos = e.target.checked
                      ? [...formData.tipos_disponiveis, 'Locação']
                      : formData.tipos_disponiveis.filter(t => t !== 'Locação');
                    setFormData((prev) => ({ ...prev, tipos_disponiveis: newTipos as ('Venda' | 'Locação')[] }));
                  }}
                  className="w-4 h-4"
                />
                <Label htmlFor="tipo-locacao" className="cursor-pointer">Locação</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Selecione os tipos de negócio disponíveis para este imóvel
            </p>
          </div>

          <div>
            <Label>Em Anúncio</Label>
            <div className="flex gap-4 mt-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  id="plataforma-meta"
                  checked={formData.plataformas_anuncio.includes('Meta')}
                  onCheckedChange={(checked) => {
                    const newPlataformas = checked
                      ? [...formData.plataformas_anuncio, 'Meta']
                      : formData.plataformas_anuncio.filter(p => p !== 'Meta');
                    setFormData((prev) => ({ ...prev, plataformas_anuncio: newPlataformas }));
                  }}
                />
                <Label htmlFor="plataforma-meta" className="cursor-pointer">Meta</Label>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="plataforma-google"
                  checked={formData.plataformas_anuncio.includes('Google')}
                  onCheckedChange={(checked) => {
                    const newPlataformas = checked
                      ? [...formData.plataformas_anuncio, 'Google']
                      : formData.plataformas_anuncio.filter(p => p !== 'Google');
                    setFormData((prev) => ({ ...prev, plataformas_anuncio: newPlataformas }));
                  }}
                />
                <Label htmlFor="plataforma-google" className="cursor-pointer">Google</Label>
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              Marque as plataformas onde este imóvel está sendo anunciado (apenas para controle interno)
            </p>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label htmlFor="quartos">Quartos</Label>
              <Input
                id="quartos"
                type="number"
                min="0"
                value={formData.quartos}
                onChange={(e) => setFormData((prev) => ({ ...prev, quartos: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="banheiros">Banheiros</Label>
              <Input
                id="banheiros"
                type="number"
                min="0"
                value={formData.banheiros}
                onChange={(e) => setFormData((prev) => ({ ...prev, banheiros: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="area_m2">Área (m²)</Label>
              <Input
                id="area_m2"
                type="number"
                min="0"
                step="0.01"
                value={formData.area_m2}
                onChange={(e) => setFormData((prev) => ({ ...prev, area_m2: e.target.value }))}
                placeholder="0"
              />
            </div>

            <div>
              <Label htmlFor="vagas">Vagas</Label>
              <Input
                id="vagas"
                type="number"
                min="0"
                value={formData.vagas}
                onChange={(e) => setFormData((prev) => ({ ...prev, vagas: e.target.value }))}
                placeholder="0"
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
            <div className="flex items-center justify-between mb-2">
              <div>
                <Label>Imagens do Imóvel (até 10 fotos de 15MB cada)</Label>
                <p className="text-xs text-muted-foreground mt-1">Arraste para reordenar • Clique para definir capa</p>
              </div>
              {editingImovel && editingImovel.image_urls && editingImovel.image_urls.length > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleDownloadImages}
                  className="gap-2"
                >
                  <Download className="h-4 w-4" />
                  Gerar ZIP
                </Button>
              )}
            </div>

            {zipUrl && (
              <div className="flex justify-end mb-2">
                <Button asChild size="sm" className="gap-2">
                  <a href={zipUrl} download={zipName || `${editingImovel?.codigo}_fotos.zip`}>
                    <Download className="h-4 w-4" />
                    Baixar ZIP
                  </a>
                </Button>
              </div>
            )}

            <ImageUpload
              currentImages={imageOrder.length > 0 ? imageOrder : editingImovel?.image_urls}
              coverIndex={coverImageIndex}
              onImagesSelect={(files) => setImageFiles([...imageFiles, ...files])}
              onRemoveImage={(index) => {
                if (editingImovel && index < (editingImovel.image_urls?.length || 0)) {
                  setRemovedImageIndices([...removedImageIndices, index]);
                  const newOrder = imageOrder.filter((_, i) => i !== index);
                  setImageOrder(newOrder);
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
              onReorderImages={(startIndex, endIndex) => {
                const newOrder = [...(imageOrder.length > 0 ? imageOrder : editingImovel?.image_urls || [])];
                setImageOrder(newOrder);
              }}
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
