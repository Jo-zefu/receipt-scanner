import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Receipt } from '../types/receipt';
import { receiptStorage } from '../utils/receiptStorage';
import { ReceiptDetailForm } from '../components/ReceiptDetailForm';
import { toast } from 'sonner';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadReceipt = async () => {
      if (!id) {
        navigate('/receipts');
        return;
      }
      try {
        const data = await receiptStorage.getById(id);
        if (data) {
          setReceipt(data);
        } else {
          toast.error('Receipt not found');
          navigate('/receipts');
        }
      } catch (error) {
        console.error('Failed to load receipt:', error);
        toast.error('Failed to load receipt');
        navigate('/receipts');
      } finally {
        setLoading(false);
      }
    };
    loadReceipt();
  }, [id, navigate]);

  const handleSave = async (updatedReceipt: Receipt) => {
    if (!id) return;
    try {
      await receiptStorage.update(id, updatedReceipt);
      toast.success('Receipt updated successfully');
      navigate('/receipts');
    } catch (error) {
      toast.error('Failed to update receipt');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  if (!receipt) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Receipt not found</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ReceiptDetailForm receipt={receipt} onSave={handleSave} />
    </div>
  );
}
