import { useState, useEffect } from 'react';
import { Receipt } from '../types/receipt';
import { receiptStorage } from '../utils/receiptStorage';
import { DashboardStats } from '../components/DashboardStats';
import { CategoryChart } from '../components/CategoryChart';
import { RecentReceiptsList } from '../components/RecentReceiptsList';
import { Button } from '../components/ui/button';
import { Plus } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { LoadingSpinner } from '../components/LoadingSpinner';

export function Dashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
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

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1>{t('dashboard.title')}</h1>
          <p className="text-muted-foreground">{t('dashboard.subtitle')}</p>
        </div>
        <Button onClick={() => navigate('/upload')}>
          <Plus className="mr-2 h-4 w-4" />
          {t('nav.scanReceipt')}
        </Button>
      </div>

      <DashboardStats receipts={receipts} />

      <div className="grid gap-6 md:grid-cols-2">
        <CategoryChart receipts={receipts} />
        <RecentReceiptsList receipts={receipts} />
      </div>
    </div>
  );
}
