import { useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Imovel } from '@/types';
import { storageService } from '@/lib/storage';
import { formatCurrency } from '@/lib/dateUtils';
import { ImovelModal } from './ImovelModal';

interface ImoveisTabProps {
  onUpdate: () => void;
  showToast: (message: string, type: 'success' | 'error') => void;
}

export const ImoveisTab = ({ onUpdate, showToast }: ImoveisTabProps) => {
  const [imoveis, setImoveis] = useState<Imovel[]>(storageService.getImoveis());
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingImovel, setEditingImovel] = useState<Imovel | null>(null);

  const handleSave = (imovel: Imovel) => {
    if (editingImovel) {
      storageService.updateImovel(imovel.id, imovel);
      showToast('Imóvel atualizado com sucesso!', 'success');
    } else {
      storageService.addImovel(imovel);
      showToast('Imóvel cadastrado com sucesso!', 'success');
    }
    setImoveis(storageService.getImoveis());
    setEditingImovel(null);
    onUpdate();
  };

  const handleEdit = (imovel: Imovel) => {
    setEditingImovel(imovel);
    setIsModalOpen(true);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja deletar este imóvel? Todas as métricas relacionadas também serão removidas.')) {
      storageService.deleteImovel(id);
      setImoveis(storageService.getImoveis());
      showToast('Imóvel deletado com sucesso!', 'success');
      onUpdate();
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingImovel(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Gerenciar Imóveis</h2>
        <Button onClick={() => setIsModalOpen(true)}>
          <span className="mr-2">+</span> Cadastrar Imóvel
        </Button>
      </div>

      {imoveis.length === 0 ? (
        <div className="bg-card rounded-xl p-12 text-center shadow-sm border border-border">
          <p className="text-6xl mb-4">🏠</p>
          <h3 className="text-xl font-semibold mb-2">Nenhum imóvel cadastrado</h3>
          <p className="text-muted-foreground mb-6">Comece cadastrando o primeiro imóvel</p>
          <Button onClick={() => setIsModalOpen(true)}>Cadastrar Imóvel</Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {imoveis.map((imovel) => (
            <div key={imovel.id} className="bg-card rounded-xl p-5 shadow-sm border border-border card-hover">
              <div className="flex items-start justify-between mb-3">
                <span className="text-xs font-semibold text-muted-foreground bg-muted px-2 py-1 rounded">
                  {imovel.codigo}
                </span>
                <span className="text-xs text-muted-foreground">{imovel.tipo}</span>
              </div>

              <h3 className="font-semibold text-base mb-2">{imovel.endereco}</h3>
              <p className="text-sm text-muted-foreground mb-1">Cliente: {imovel.cliente}</p>
              {imovel.valor && <p className="text-sm font-semibold text-accent mb-4">{formatCurrency(imovel.valor)}</p>}

              <div className="flex gap-2 mt-4 pt-4 border-t border-border">
                <Button variant="outline" size="sm" onClick={() => handleEdit(imovel)} className="flex-1 text-xs">
                  ✏️ Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => handleDelete(imovel.id)} className="flex-1 text-xs text-destructive hover:text-destructive">
                  🗑️ Deletar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <ImovelModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        onSave={handleSave}
        editingImovel={editingImovel}
      />
    </div>
  );
};
