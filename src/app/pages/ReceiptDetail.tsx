import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { Receipt } from '../types/receipt';
import { receiptStorage } from '../utils/receiptStorage';
import { ReceiptDetailForm } from '../components/ReceiptDetailForm';
import { toast } from 'sonner';

export function ReceiptDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [receipt, setReceipt] = useState<Receipt | null>(null);

  useEffect(() => {
    if (id) {
      const data = receiptStorage.getById(id);
      if (data) {
        setReceipt(data);
      } else {
        toast.error('Receipt not found');
        navigate('/receipts');
      }
    }
  }, [id, navigate]);

  const handleSave = (updatedReceipt: Receipt) => {
    if (id) {
      receiptStorage.update(id, updatedReceipt);
      toast.success('Receipt updated successfully');
      navigate('/receipts');
    }
  };

  if (!receipt) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <ReceiptDetailForm receipt={receipt} onSave={handleSave} />
    </div>
  );
}
