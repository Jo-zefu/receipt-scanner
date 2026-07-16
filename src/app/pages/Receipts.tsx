import { useState, useEffect } from 'react';
import { Receipt } from '../types/receipt';
import { receiptStorage } from '../utils/receiptStorage';
import { ReceiptsTable } from '../components/ReceiptsTable';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';

export function Receipts() {
  const navigate = useNavigate();
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadReceipts();
  }, []);

  const loadReceipts = async () => {
    setLoading(true);
    const data = await receiptStorage.getAll();
    setReceipts(data);
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    await receiptStorage.delete(id);
    toast.success('Receipt deleted');
    await loadReceipts();
  };

  const handleUpdate = async (id: string, updates: Partial<Receipt>) => {
    await receiptStorage.update(id, updates);
    toast.success('Receipt updated');
    await loadReceipts();
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
          <h1>Receipts</h1>
          <p className="text-muted-foreground">Manage and export your receipt data</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Plus className="mr-2 h-4 w-4" />
          New Receipt
        </Button>
      </div>

      <ReceiptsTable receipts={receipts} onDelete={handleDelete} onUpdate={handleUpdate} />
    </div>
  );
}
