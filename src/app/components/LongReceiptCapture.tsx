import { useState, useRef } from 'react';
import { Camera, Plus, Trash2, Loader2, CheckCircle2, ImageIcon } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { api } from '../utils/api';
import { Receipt } from '../types/receipt';
import { toast } from 'sonner';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

interface LongReceiptCaptureProps {
  onComplete?: (receipt: Receipt) => void;
}

export function LongReceiptCapture({ onComplete }: LongReceiptCaptureProps) {
  const { t } = useTranslation();
  const [pages, setPages] = useState<{ id: string; file: File; preview: string }[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [result, setResult] = useState<Receipt | null>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const addPage = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      setPages((prev) => [
        ...prev,
        {
          id: `page-${Date.now()}-${Math.random().toString(36).slice(2)}`,
          file,
          preview: e.target?.result as string,
        },
      ]);
    };
    reader.readAsDataURL(file);
  };

  const handleCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files) {
      Array.from(files).forEach(addPage);
    }
    e.target.value = '';
  };

  const removePage = (id: string) => {
    setPages((prev) => prev.filter((p) => p.id !== id));
  };

  const processAll = async () => {
    if (pages.length === 0) return;

    setIsProcessing(true);
    setProgress(10);

    try {
      setProgress(30);
      const files = pages.map((p) => p.file);
      const apiResult = await api.scanMultiReceipt(files);
      setProgress(80);

      const receipt: Receipt = {
        id: apiResult.id,
        merchantName: apiResult.vendor || 'Unknown',
        date: apiResult.date || new Date().toISOString().split('T')[0],
        amount: apiResult.amount || 0,
        category: apiResult.category || 'Other',
        paymentMethod: apiResult.payment_method || 'Other',
        description: '',
        imageUrl: apiResult.image_url || undefined,
        createdAt: apiResult.created_at,
      };

      setProgress(100);
      setResult(receipt);
      toast.success(t('longReceipt.success'));

      if (onComplete) {
        onComplete(receipt);
      }
    } catch (error) {
      console.error('Long receipt scan failed:', error);
      toast.error(t('longReceipt.failed'));
    } finally {
      setIsProcessing(false);
    }
  };

  const reset = () => {
    setPages([]);
    setResult(null);
    setProgress(0);
  };

  if (result) {
    return (
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3 text-green-600">
            <CheckCircle2 className="h-5 w-5" />
            <span className="font-medium">{t('longReceipt.success')}</span>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('edit.merchant')}:</span>
              <span>{result.merchantName}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('edit.date')}:</span>
              <span>{result.date}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('edit.amount')}:</span>
              <span className="font-semibold">{formatCurrency(result.amount)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">{t('edit.category')}:</span>
              <span>{result.category}</span>
            </div>
          </div>

          <div className="text-sm text-muted-foreground">
            {t('longReceipt.pagesScanned', { count: pages.length })}
          </div>

          <Button onClick={reset} variant="outline" className="w-full">
            {t('longReceipt.scanAnother')}
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-medium">{t('longReceipt.title')}</h3>
          <p className="text-sm text-muted-foreground mt-1">
            {t('longReceipt.description')}
          </p>
        </div>

        {/* Page previews */}
        {pages.length > 0 && (
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
            {pages.map((page, index) => (
              <div key={page.id} className="relative group">
                <img
                  src={page.preview}
                  alt={`Page ${index + 1}`}
                  className="w-full h-24 object-cover rounded-lg border"
                />
                <div className="absolute top-0 left-0 bg-primary text-primary-foreground text-xs px-1.5 py-0.5 rounded-tl-lg rounded-br-lg">
                  {index + 1}
                </div>
                <button
                  onClick={() => removePage(page.id)}
                  className="absolute top-0 right-0 bg-destructive text-destructive-foreground p-1 rounded-tr-lg rounded-bl-lg opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Capture buttons */}
        <div className="flex gap-3">
          <Button
            onClick={() => cameraRef.current?.click()}
            variant="outline"
            className="flex-1"
            disabled={isProcessing}
          >
            <Camera className="mr-2 h-4 w-4" />
            {pages.length === 0 ? t('longReceipt.takeFirst') : t('longReceipt.addMore')}
          </Button>

          <Button
            onClick={() => fileRef.current?.click()}
            variant="outline"
            disabled={isProcessing}
          >
            <ImageIcon className="mr-2 h-4 w-4" />
            {t('longReceipt.fromGallery')}
          </Button>
        </div>

        <input
          ref={cameraRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleCapture}
          className="hidden"
        />
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple
          onChange={handleCapture}
          className="hidden"
        />

        {/* Process button */}
        {pages.length > 0 && !isProcessing && (
          <Button onClick={processAll} className="w-full">
            {t('longReceipt.process', { count: pages.length })}
          </Button>
        )}

        {/* Processing state */}
        {isProcessing && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <span>{t('longReceipt.processing')}</span>
            </div>
            <Progress value={progress} className="w-full" />
          </div>
        )}
      </div>
    </Card>
  );
}
