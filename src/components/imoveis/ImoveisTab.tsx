import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { ImovelModal } from './ImovelModal';
import type { Imovel } from '@/types';
import { supabaseStorageService } from '@/lib/supabaseStorage';
import { formatCurrency } from '@/lib/dateUtils';
import { Building2, MapPin, User, DollarSign, Pencil, Trash2, Home } from 'lucide-react';
import metaLogo from '@/assets/meta-logo.png';
import googleAdsLogo from '@/assets/google-ads-logo.png';

interface ImoveisTabProps {
  onToast: (message: string, type: 'success' | 'error') => void;
}

export const ImoveisTab = ({ onToast }: ImoveisTabProps) => {
  const [imoveis, setImoveis] = useState<Imovel[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);
  const [loading, setLoading] = useState(true);

  const loadImoveis = async () => {
    try {
      const data = await supabaseStorageService.getImoveis();
      setImoveis(data);
    } catch (error) {
      console.error('Erro ao carregar imóveis:', error);
      onToast('Erro ao carregar imóveis', 'error');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadImoveis();
  }, []);

  const handleAdd = () => {
    setEditingImovel(null);
    setIsModalOpen(true);
  };

  const handleEdit = (imovel: Imovel) => {
    setEditingImovel(imovel);
    setIsModalOpen(true);
  };

  const handleDelete = async (imovel: Imovel) => {
    if (!confirm(`Deseja realmente excluir o imóvel ${imovel.codigo}?`)) return;

    try {
      if (imovel.image_urls && imovel.image_urls.length > 0) {
        await supabaseStorageService.deleteImages(imovel.image_urls);
      }
      await supabaseStorageService.deleteImovel(imovel.id);
      await loadImoveis();
      onToast('Imóvel excluído com sucesso', 'success');
    } catch (error) {
      console.error('Erro ao excluir imóvel:', error);
      onToast('Erro ao excluir imóvel', 'error');
    }
  };

  const handleSave = async () => {
    await loadImoveis();
    onToast(
      editingImovel ? 'Imóvel atualizado com sucesso' : 'Imóvel cadastrado com sucesso',
      'success'
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-muted-foreground">Carregando imóveis...</div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-foreground">Imóveis Cadastrados</h2>
        <Button onClick={handleAdd} className="gap-2">
          <Building2 className="h-4 w-4" />
          Cadastrar Imóvel
        </Button>
      </div>

      {imoveis.length === 0 ? (
        <Card className="p-12 text-center card-hover">
          <Home className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h3 className="text-lg font-semibold mb-2">Nenhum imóvel cadastrado</h3>
          <p className="text-muted-foreground mb-4">
            Comece cadastrando seu primeiro imóvel
          </p>
          <Button onClick={handleAdd}>Cadastrar Primeiro Imóvel</Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {imoveis.map((imovel) => (
            <Card key={imovel.id} className="overflow-hidden card-hover group">
              <div className="relative h-48 bg-muted overflow-hidden">
                {imovel.image_urls && imovel.image_urls.length > 0 ? (
                  <>
                    <img
                      src={imovel.image_urls[0]}
                      alt={imovel.endereco}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {imovel.image_urls.length > 1 && (
                      <div className="absolute bottom-3 left-3 px-2 py-1 bg-background/90 backdrop-blur-sm rounded text-xs font-medium">
                        +{imovel.image_urls.length - 1} fotos
                      </div>
                    )}
                  </>
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-muted to-muted-foreground/10">
                    <Home className="h-16 w-16 text-muted-foreground/40" />
                  </div>
                )}
                <div className="absolute top-3 left-3 px-3 py-1 bg-background/90 backdrop-blur-sm rounded-full text-xs font-medium">
                  {imovel.tipo}
                </div>
                <div className="absolute top-3 right-3 flex items-center gap-1.5">
                  {imovel.plataformas_anuncio?.includes('Meta Ads') && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img src={metaLogo} alt="Meta Ads" className="w-4 h-4 object-contain" />
                    </div>
                  )}
                  {imovel.plataformas_anuncio?.includes('Google Ads') && (
                    <div className="w-6 h-6 bg-white rounded-full flex items-center justify-center shadow-sm">
                      <img src={googleAdsLogo} alt="Google Ads" className="w-4 h-4 object-contain" />
                    </div>
                  )}
                  <Link 
                    to={`/${imovel.codigo}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-full text-xs font-bold hover:bg-primary/90 transition-colors cursor-pointer"
                  >
                    {imovel.codigo}
                  </Link>
                </div>
              </div>

              <div className="p-4 space-y-3">
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-muted-foreground mt-0.5 flex-shrink-0" />
                  <p className="text-sm font-medium line-clamp-2">{imovel.endereco}</p>
                </div>

                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                  <p className="text-sm text-muted-foreground truncate">{imovel.cliente}</p>
                </div>

                {imovel.valor && (
                  <div className="flex items-center gap-2 pt-2 border-t">
                    <DollarSign className="h-4 w-4 text-foreground flex-shrink-0" />
                    <p className="text-lg font-bold text-foreground">
                      {formatCurrency(imovel.valor)}
                    </p>
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleEdit(imovel)}
                    className="flex-1 gap-2"
                  >
                    <Pencil className="h-3 w-3" />
                    Editar
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleDelete(imovel)}
                    className="gap-2"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      <ImovelModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSave}
        editingImovel={editingImovel}
      />
    </div>
  );
};
