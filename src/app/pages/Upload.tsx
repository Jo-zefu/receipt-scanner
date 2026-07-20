import { BulkReceiptUpload } from '../components/BulkReceiptUpload';
import { useNavigate } from 'react-router';
import { Receipt } from '../types/receipt';
import { useTranslation } from 'react-i18next';

export function Upload() {
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleAllSaved = (receipts: Receipt[]) => {
    setTimeout(() => navigate('/receipts'), 800);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1>{t('upload.title')}</h1>
        <p className="text-muted-foreground">
          {t('upload.subtitle')}
        </p>
      </div>

      <BulkReceiptUpload onAllSaved={handleAllSaved} />
    </div>
  );
}
