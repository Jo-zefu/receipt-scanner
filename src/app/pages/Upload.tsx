import { useState } from 'react';
import { BulkReceiptUpload } from '../components/BulkReceiptUpload';
import { LongReceiptCapture } from '../components/LongReceiptCapture';
import { useNavigate } from 'react-router';
import { Receipt } from '../types/receipt';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/button';
import { Camera, Upload as UploadIcon } from 'lucide-react';

export function Upload() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [mode, setMode] = useState<'bulk' | 'long'>('bulk');

  const handleAllSaved = (receipts: Receipt[]) => {
    setTimeout(() => navigate('/receipts'), 800);
  };

  const handleLongComplete = (receipt: Receipt) => {
    setTimeout(() => navigate('/receipts'), 1500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1>{t('upload.title')}</h1>
        <p className="text-muted-foreground">
          {t('upload.subtitle')}
        </p>
      </div>

      {/* Mode switcher */}
      <div className="flex gap-2 mb-4">
        <Button
          variant={mode === 'bulk' ? 'default' : 'outline'}
          onClick={() => setMode('bulk')}
          size="sm"
        >
          <UploadIcon className="mr-2 h-4 w-4" />
          {t('upload.normalMode')}
        </Button>
        <Button
          variant={mode === 'long' ? 'default' : 'outline'}
          onClick={() => setMode('long')}
          size="sm"
        >
          <Camera className="mr-2 h-4 w-4" />
          {t('upload.longMode')}
        </Button>
      </div>

      {mode === 'bulk' ? (
        <BulkReceiptUpload onAllSaved={handleAllSaved} />
      ) : (
        <LongReceiptCapture onComplete={handleLongComplete} />
      )}
    </div>
  );
}
