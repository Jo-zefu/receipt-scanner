import { useState, useEffect } from 'react';
import { Receipt } from '../types/receipt';
import { receiptStorage } from '../utils/receiptStorage';
import { ReceiptsTable } from '../components/ReceiptsTable';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { DeleteConfirmDialog } from '../components/DeleteConfirmDialog';

export function Receipts() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ type: 'single' | 'batch'; id?: string }>({ type: 'single' });

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setLoading(true);
    const data = await receiptStorage.getAll();
    setReceipts(data);
    setLoading(false);
  };

  const handleDeleteRequest = (id: string) => {
    setDeleteTarget({ type: 'single', id });
    setDeleteDialogOpen(true);
  };

  const handleBatchDeleteRequest = () => {
    if (selectedIds.length === 0) return;
    setDeleteTarget({ type: 'batch' });
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (deleteTarget.type === 'single' && deleteTarget.id) {
        await receiptStorage.delete(deleteTarget.id);
        toast.success(t('toast.receiptDeleted'));
      } else if (deleteTarget.type === 'batch') {
        await Promise.all(selectedIds.map(id => receiptStorage.delete(id)));
        toast.success(t('delete.successMultiple', { count: selectedIds.length }));
        setSelectedIds([]);
      }
      await loadReceipts();
    } catch (error) {
      toast.error(t('toast.deleteFailed'));
    }
  };

  const handleUpdate = async (id: string, updates: Partial<Receipt>) => {
    try {
      await receiptStorage.update(id, updates);
      toast.success(t('toast.receiptUpdated'));
      await loadReceipts();
    } catch (error) {
      toast.error(t('toast.updateFailed'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{t('receipts.title')}</h1>
          <p className="text-muted-foreground">{t('receipts.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('receipts.newReceipt')}
        </Button>
      </div>

      <ReceiptsTable
        receipts={receipts}
        onDelete={handleDeleteRequest}
        onUpdate={handleUpdate}
        selectedIds={selectedIds}
        onSelectionChange={setSelectedIds}
        onBatchDelete={handleBatchDeleteRequest}
      />

      <DeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        count={deleteTarget.type === 'batch' ? selectedIds.length : 1}
        onConfirm={handleDeleteConfirm}
      />
    </div>
  );
}
