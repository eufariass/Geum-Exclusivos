import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Upload, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import type { Imovel } from '@/types';
import { getCurrentMonth } from '@/lib/dateUtils';

interface AIMetricsImportProps {
  imoveis: Imovel[];
  onSuccess: () => void;
  onToast: (message: string, type: 'success' | 'error') => void;
}

interface ExtractedData {
  leads: number;
  visualizacoes: number;
  visitas: number;
  periodo: string | null;
  plataforma: string;
  confianca: 'alta' | 'media' | 'baixa';
}

export const AIMetricsImport = ({ imoveis, onSuccess, onToast }: AIMetricsImportProps) => {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [selectedImovel, setSelectedImovel] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('image/')) {
        onToast('Por favor, selecione um arquivo de imagem', 'error');
        return;
      }

      if (file.size > 10 * 1024 * 1024) {
        onToast('Imagem muito grande. Máximo 10MB', 'error');
        return;
      }

      setImageFile(file);
      
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
      
      setExtractedData(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      const input = document.getElementById('file-input') as HTMLInputElement;
      const dataTransfer = new DataTransfer();
      dataTransfer.items.add(file);
      input.files = dataTransfer.files;
      handleFileSelect({ target: input } as any);
    }
  };

  const analyzeImage = async () => {
    if (!imagePreview) return;

    setIsAnalyzing(true);
    try {
      const { data, error } = await supabase.functions.invoke('extract-metrics-from-image', {
        body: { image: imagePreview }
      });

      if (error) throw error;

      setExtractedData(data);
      
      if (data.periodo) {
        setSelectedMonth(data.periodo);
      }
      
      onToast(`Métricas extraídas com confiança ${data.confianca}!`, 'success');
    } catch (error) {
      console.error('Erro ao analisar imagem:', error);
      onToast('Erro ao analisar imagem com IA', 'error');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSave = async () => {
    if (!extractedData || !selectedImovel) {
      onToast('Selecione um imóvel antes de salvar', 'error');
      return;
    }

    try {
      const { error } = await supabase
        .from('metricas')
        .insert({
          imovel_id: selectedImovel,
          mes: selectedMonth,
          leads: extractedData.leads,
          visualizacoes: extractedData.visualizacoes,
          visitas_realizadas: extractedData.visitas,
          data_registro: new Date().toISOString(),
        });

      if (error) throw error;

      onToast('Métricas salvas com sucesso!', 'success');
      
      setImageFile(null);
      setImagePreview(null);
      setExtractedData(null);
      setSelectedImovel('');
      setSelectedMonth(getCurrentMonth());
      
      onSuccess();
    } catch (error) {
      console.error('Erro ao salvar métricas:', error);
      onToast('Erro ao salvar métricas', 'error');
    }
  };

  const getConfidenceColor = (conf: string) => {
    switch (conf) {
      case 'alta': return 'text-green-600 dark:text-green-400';
      case 'media': return 'text-yellow-600 dark:text-yellow-400';
      case 'baixa': return 'text-red-600 dark:text-red-400';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-card rounded-xl p-6 shadow-sm border border-border">
        <h2 className="text-xl font-bold mb-4">📸 Importar Métricas por IA</h2>
        
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary/50 transition-colors cursor-pointer"
          onClick={() => document.getElementById('file-input')?.click()}
        >
          <input
            id="file-input"
            type="file"
            accept="image/*"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {!imagePreview ? (
            <div className="space-y-2">
              <Upload className="w-12 h-12 mx-auto text-muted-foreground" />
              <p className="text-lg font-medium">Arraste o print aqui</p>
              <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
              <p className="text-xs text-muted-foreground">PNG, JPG ou WEBP (máx 10MB)</p>
            </div>
          ) : (
            <div className="space-y-4">
              <img
                src={imagePreview}
                alt="Preview"
                className="max-h-64 mx-auto rounded-lg shadow-md"
              />
              <p className="text-sm text-muted-foreground">{imageFile?.name}</p>
            </div>
          )}
        </div>

        {imagePreview && !extractedData && (
          <Button
            onClick={analyzeImage}
            disabled={isAnalyzing}
            className="w-full mt-4"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Analisando com IA...
              </>
            ) : (
              '🤖 Analisar com IA'
            )}
          </Button>
        )}

        {extractedData && (
          <div className="mt-6 p-4 bg-muted/50 rounded-lg border border-border space-y-4">
            <div className="flex items-center gap-2 mb-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold">Dados Extraídos</h3>
            </div>

            <div className="grid gap-3 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Plataforma:</span>
                <span className="font-medium">{extractedData.plataforma}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">Confiança:</span>
                <span className={`font-medium capitalize ${getConfidenceColor(extractedData.confianca)}`}>
                  {extractedData.confianca}
                </span>
              </div>

              <div className="h-px bg-border my-2" />

              <div className="flex justify-between">
                <span className="text-muted-foreground">📧 Leads:</span>
                <span className="font-bold">{extractedData.leads}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">👁️ Visualizações:</span>
                <span className="font-bold">{extractedData.visualizacoes.toLocaleString('pt-BR')}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-muted-foreground">🚗 Visitas:</span>
                <span className="font-bold">{extractedData.visitas}</span>
              </div>

              {extractedData.periodo && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">📅 Período detectado:</span>
                  <span className="font-medium">{extractedData.periodo}</span>
                </div>
              )}
            </div>

            {extractedData.confianca === 'baixa' && (
              <div className="flex items-start gap-2 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded text-sm">
                <AlertCircle className="w-4 h-4 text-yellow-600 mt-0.5 flex-shrink-0" />
                <p className="text-yellow-600 dark:text-yellow-400">
                  Confiança baixa. Revise os valores antes de salvar.
                </p>
              </div>
            )}

            <div className="grid gap-4 sm:grid-cols-2 mt-4">
              <div>
                <Label>Imóvel *</Label>
                <Select value={selectedImovel} onValueChange={setSelectedImovel}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o imóvel" />
                  </SelectTrigger>
                  <SelectContent>
                    {imoveis.map((imovel) => (
                      <SelectItem key={imovel.id} value={imovel.id}>
                        {imovel.codigo} - {imovel.endereco}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Mês *</Label>
                <Input
                  type="month"
                  value={selectedMonth}
                  onChange={(e) => setSelectedMonth(e.target.value)}
                />
              </div>
            </div>

            <Button
              onClick={handleSave}
              disabled={!selectedImovel}
              className="w-full mt-2"
            >
              ✅ Confirmar e Salvar Métricas
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};
