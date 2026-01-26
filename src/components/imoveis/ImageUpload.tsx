import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { X, Image as ImageIcon, GripVertical } from 'lucide-react';

interface ImageUploadProps {
  currentImages?: string[];
  coverIndex?: number;
  onImagesSelect: (files: File[]) => void;
  onRemoveImage: (index: number) => void;
  onSetCover: (index: number) => void;
  onReorderImages: (newOrder: string[]) => void;
}

const MAX_IMAGES = 10;
const MAX_SIZE = 15 * 1024 * 1024; // 15MB

export const ImageUpload = ({ currentImages = [], coverIndex = 0, onImagesSelect, onRemoveImage, onSetCover, onReorderImages }: ImageUploadProps) => {
  const [previews, setPreviews] = useState<string[]>(currentImages);
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync previews with currentImages when they change
  useEffect(() => {
    setPreviews(currentImages);
  }, [currentImages]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (previews.length + files.length > MAX_IMAGES) {
      alert(`Você pode adicionar no máximo ${MAX_IMAGES} imagens`);
      return;
    }

    const validFiles: File[] = [];
    const newPreviews: string[] = [];

    for (const file of files) {
      // Validação de tipo
      if (!file.type.startsWith('image/')) {
        alert('Por favor, selecione apenas arquivos de imagem');
        continue;
      }

      // Validação de tamanho (15MB)
      if (file.size > MAX_SIZE) {
        alert(`A imagem ${file.name} excede o limite de 15MB`);
        continue;
      }

      validFiles.push(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        newPreviews.push(reader.result as string);
        if (newPreviews.length === validFiles.length) {
          setPreviews([...previews, ...newPreviews]);
        }
      };
      reader.readAsDataURL(file);
    }

    if (validFiles.length > 0) {
      onImagesSelect(validFiles);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemove = (index: number) => {
    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
    onRemoveImage(index);
  };

  const handleDragStart = (e: React.DragEvent, index: number) => {
    setDraggedIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    if (draggedIndex === null || draggedIndex === index) return;

    const newPreviews = [...previews];
    const draggedItem = newPreviews[draggedIndex];
    newPreviews.splice(draggedIndex, 1);
    newPreviews.splice(index, 0, draggedItem);

    setPreviews(newPreviews);
    setDraggedIndex(index);
  };

  const handleDragEnd = () => {
    if (draggedIndex !== null) {
      // Pass the new order to parent
      onReorderImages(previews);
    }
    setDraggedIndex(null);
  };

  const canAddMore = previews.length < MAX_IMAGES;

  return (
    <div className="space-y-3">
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileChange}
        className="hidden"
        id="image-upload"
      />

      {previews.length > 0 && (
        <div className="grid grid-cols-2 gap-3">
          {previews.map((preview, index) => (
            <div
              key={index}
              draggable
              onDragStart={(e) => handleDragStart(e, index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
              className={`relative group cursor-move ${
                draggedIndex === index ? 'opacity-50' : 'opacity-100'
              }`}
              title="Arraste para reordenar"
            >
              <div className="absolute top-2 left-2 z-20 bg-background/80 rounded p-1">
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
              <div
                onClick={() => onSetCover(index)}
                className="cursor-pointer"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className={`w-full h-32 object-cover rounded-lg border-2 transition-all ${
                    index === coverIndex 
                      ? 'border-accent shadow-lg' 
                      : 'border-border hover:border-accent/50'
                  }`}
                />
              </div>
              <Button
                type="button"
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 z-10"
                onClick={(e) => {
                  e.stopPropagation();
                  handleRemove(index);
                }}
              >
                <X className="h-3 w-3" />
              </Button>
              {index === coverIndex && (
                <div className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-xs px-2 py-1 rounded font-medium">
                  ⭐ Capa
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {canAddMore && (
        <label
          htmlFor="image-upload"
          className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors"
        >
          <div className="flex flex-col items-center gap-2 text-muted-foreground">
            <ImageIcon className="h-8 w-8" />
            <div className="text-sm text-center">
              <span className="font-medium text-foreground">Clique para adicionar imagens</span>
              <p className="text-xs mt-1">
                PNG, JPG até 15MB ({previews.length}/{MAX_IMAGES})
              </p>
            </div>
          </div>
        </label>
      )}
    </div>
  );
};
