import { useState, useRef, useCallback } from 'react';
import {
  Upload,
  Camera,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  Trash2,
  Save,
  ChevronDown,
  ChevronUp,
  ImageIcon,
} from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { Input } from './ui/input';
import { Label } from './ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { api } from '../utils/api';
import { Receipt, Category, PaymentMethod } from '../types/receipt';
import { toast } from 'sonner';
import { Badge } from './ui/badge';

type ItemStatus = 'pending' | 'processing' | 'done' | 'error';

interface QueueItem {
  id: string;
  file: File;
  status: ItemStatus;
  preview: string;
  progress: number;
  receipt: Partial<Receipt>;
  error?: string;
  expanded: boolean;
}

const CATEGORIES: Category[] = [
  'Food & Dining',
  'Transportation',
  'Shopping',
  'Entertainment',
  'Healthcare',
  'Travel',
  'Office Supplies',
  'Utilities',
  'Other',
];

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Digital Wallet',
  'Other',
];

interface BulkReceiptUploadProps {
  onAllSaved?: (receipts: Receipt[]) => void;
}

export function BulkReceiptUpload({ onAllSaved }: BulkReceiptUploadProps) {
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessingAll, setIsProcessingAll] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const processingRef = useRef(false);

  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const createPreview = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const addFiles = useCallback(async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    const newItems: QueueItem[] = await Promise.all(
      imageFiles.map(async (file) => ({
        id: `item-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        file,
        status: 'pending' as ItemStatus,
        preview: await createPreview(file),
        progress: 0,
        receipt: {
          category: 'Other',
          paymentMethod: 'Credit Card',
          description: '',
        },
        expanded: false,
      }))
    );

    setQueue((prev) => [...prev, ...newItems]);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      addFiles(Array.from(e.dataTransfer.files));
    },
    [addFiles]
  );

  const handleFileSelect = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      if (e.target.files) addFiles(Array.from(e.target.files));
      e.target.value = '';
    },
    [addFiles]
  );

  const updateItem = (id: string, patch: Partial<QueueItem>) => {
    setQueue((prev) => prev.map((item) => (item.id === id ? { ...item, ...patch } : item)));
  };

  const updateReceiptField = (id: string, field: keyof Receipt, value: unknown) => {
    setQueue((prev) =>
      prev.map((item) =>
        item.id === id
          ? { ...item, receipt: { ...item.receipt, [field]: value } }
          : item
      )
    );
  };

  const removeItem = (id: string) => {
    setQueue((prev) => prev.filter((item) => item.id !== id));
  };

  const processSingle = async (item: QueueItem) => {
    updateItem(item.id, { status: 'processing', progress: 10 });

    try {
      updateItem(item.id, { progress: 30 });
      const result = await api.scanReceipt(item.file);
      updateItem(item.id, { progress: 100 });

      const receipt: Partial<Receipt> = {
        id: result.id,
        merchantName: result.vendor || 'Unknown',
        date: result.date || new Date().toISOString().split('T')[0],
        amount: result.amount || 0,
        category: result.category || 'Other',
        paymentMethod: 'Credit Card',
        description: '',
        imageUrl: result.image_url || undefined,
      };

      updateItem(item.id, { status: 'done', receipt, expanded: true });
    } catch (err) {
      updateItem(item.id, {
        status: 'error',
        error: 'OCR failed — please edit manually',
        receipt: {
          merchantName: '',
          date: new Date().toISOString().split('T')[0],
          amount: 0,
          category: 'Other',
          paymentMethod: 'Credit Card',
          description: '',
        },
        expanded: true,
      });
    }
  };

  const processAll = async () => {
    if (processingRef.current) return;
    processingRef.current = true;
    setIsProcessingAll(true);

    const pending = queue.filter((i) => i.status === 'pending' || i.status === 'error');

    // Process with concurrency of 2 to avoid memory issues with Tesseract workers
    const CONCURRENCY = 2;
    let index = 0;

    const worker = async () => {
      while (index < pending.length) {
        const item = pending[index++];
        await processSingle(item);
      }
    };

    const workers = Array.from({ length: Math.min(CONCURRENCY, pending.length) }, () =>
      worker()
    );
    await Promise.all(workers);

    processingRef.current = false;
    setIsProcessingAll(false);
  };

  const saveAll = () => {
    const done = queue.filter((i) => i.status === 'done' || i.status === 'error');
    const saved: Receipt[] = [];

    done.forEach((item) => {
      // Receipts are already saved to DB via the scan API
      const receipt: Receipt = {
        id: item.receipt.id || `receipt-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        merchantName: item.receipt.merchantName || 'Unknown Merchant',
        date: item.receipt.date || new Date().toISOString().split('T')[0],
        amount: item.receipt.amount || 0,
        taxAmount: item.receipt.taxAmount,
        category: item.receipt.category || 'Other',
        paymentMethod: item.receipt.paymentMethod || 'Credit Card',
        description: item.receipt.description || '',
        imageUrl: item.receipt.imageUrl,
        createdAt: new Date().toISOString(),
      };
      saved.push(receipt);
    });

    toast.success(`${saved.length} receipt${saved.length !== 1 ? 's' : ''} saved!`);
    setQueue((prev) => prev.filter((i) => i.status === 'pending' || i.status === 'processing'));
    onAllSaved?.(saved);
  };

  const pendingCount = queue.filter((i) => i.status === 'pending').length;
  const processingCount = queue.filter((i) => i.status === 'processing').length;
  const doneCount = queue.filter((i) => i.status === 'done').length;
  const errorCount = queue.filter((i) => i.status === 'error').length;
  const saveable = doneCount + errorCount;

  return (
    <div className="space-y-6">
      {/* Drop zone */}
      <Card
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={`border-2 border-dashed transition-all cursor-pointer ${
          isDragging
            ? 'border-primary bg-primary/5'
            : 'border-muted-foreground/25 hover:border-primary/50'
        }`}
        onClick={() => fileInputRef.current?.click()}
      >
        <div className="py-10 px-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="p-3 bg-primary/10 rounded-full">
              <Upload className="w-8 h-8 text-primary" />
            </div>
          </div>
          <h3 className="mb-1">Drop receipts here</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Select multiple images at once — no limit
          </p>
          <div className="flex gap-3 justify-center" onClick={(e) => e.stopPropagation()}>
            <Button onClick={() => fileInputRef.current?.click()} variant="default" size="sm">
              <Upload className="mr-2 h-4 w-4" />
              Choose Files
            </Button>
            <Button onClick={() => cameraInputRef.current?.click()} variant="outline" size="sm">
              <Camera className="mr-2 h-4 w-4" />
              Camera
            </Button>
          </div>
          <p className="text-xs text-muted-foreground mt-3">JPG, PNG, HEIC supported</p>
        </div>
      </Card>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        multiple
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Toolbar */}
      {queue.length > 0 && (
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap gap-2 text-sm">
            {pendingCount > 0 && (
              <Badge variant="secondary">
                <Clock className="mr-1 h-3 w-3" />
                {pendingCount} pending
              </Badge>
            )}
            {processingCount > 0 && (
              <Badge variant="outline" className="text-blue-600 border-blue-300">
                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                {processingCount} scanning
              </Badge>
            )}
            {doneCount > 0 && (
              <Badge variant="outline" className="text-green-600 border-green-300">
                <CheckCircle2 className="mr-1 h-3 w-3" />
                {doneCount} ready
              </Badge>
            )}
            {errorCount > 0 && (
              <Badge variant="outline" className="text-amber-600 border-amber-300">
                <XCircle className="mr-1 h-3 w-3" />
                {errorCount} needs review
              </Badge>
            )}
          </div>

          <div className="flex gap-2">
            {pendingCount > 0 && (
              <Button
                onClick={processAll}
                disabled={isProcessingAll}
                size="sm"
              >
                {isProcessingAll ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Upload className="mr-2 h-4 w-4" />
                )}
                Scan All ({pendingCount})
              </Button>
            )}
            {saveable > 0 && (
              <Button onClick={saveAll} size="sm" variant="default" className="bg-green-600 hover:bg-green-700">
                <Save className="mr-2 h-4 w-4" />
                Save {saveable} Receipt{saveable !== 1 ? 's' : ''}
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Queue list */}
      {queue.length > 0 && (
        <div className="space-y-3">
          {queue.map((item) => (
            <QueueCard
              key={item.id}
              item={item}
              onRemove={removeItem}
              onToggleExpand={(id) =>
                updateItem(id, { expanded: !queue.find((i) => i.id === id)?.expanded })
              }
              onFieldChange={updateReceiptField}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface QueueCardProps {
  item: QueueItem;
  onRemove: (id: string) => void;
  onToggleExpand: (id: string) => void;
  onFieldChange: (id: string, field: keyof Receipt, value: unknown) => void;
}

function QueueCard({ item, onRemove, onToggleExpand, onFieldChange }: QueueCardProps) {
  const statusColor = {
    pending: 'border-muted',
    processing: 'border-blue-300',
    done: 'border-green-300',
    error: 'border-amber-300',
  }[item.status];

  const statusIcon = {
    pending: <Clock className="h-4 w-4 text-muted-foreground" />,
    processing: <Loader2 className="h-4 w-4 text-blue-500 animate-spin" />,
    done: <CheckCircle2 className="h-4 w-4 text-green-500" />,
    error: <XCircle className="h-4 w-4 text-amber-500" />,
  }[item.status];

  const statusLabel = {
    pending: 'Pending',
    processing: 'Scanning...',
    done: 'Ready to save',
    error: 'Needs review',
  }[item.status];

  return (
    <Card className={`border ${statusColor} overflow-hidden`}>
      {/* Header row */}
      <div className="flex items-center gap-3 p-3">
        {/* Thumbnail */}
        <div className="flex-shrink-0 w-14 h-14 rounded-md overflow-hidden bg-muted flex items-center justify-center">
          {item.preview ? (
            <img src={item.preview} alt="Receipt" className="w-full h-full object-cover" />
          ) : (
            <ImageIcon className="h-6 w-6 text-muted-foreground" />
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <p className="font-medium truncate text-sm">
            {item.receipt.merchantName || item.file.name}
          </p>
          <div className="flex items-center gap-1.5 mt-0.5">
            {statusIcon}
            <span className="text-xs text-muted-foreground">{statusLabel}</span>
            {item.receipt.amount !== undefined && item.receipt.amount > 0 && (
              <>
                <span className="text-xs text-muted-foreground">·</span>
                <span className="text-xs font-medium">${item.receipt.amount.toFixed(2)}</span>
              </>
            )}
          </div>

          {item.status === 'processing' && (
            <Progress value={item.progress} className="h-1 mt-2" />
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-1 flex-shrink-0">
          {(item.status === 'done' || item.status === 'error') && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7"
              onClick={() => onToggleExpand(item.id)}
            >
              {item.expanded ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </Button>
          )}
          {item.status !== 'processing' && (
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-destructive hover:text-destructive"
              onClick={() => onRemove(item.id)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>

      {/* Expandable edit form */}
      {item.expanded && (item.status === 'done' || item.status === 'error') && (
        <div className="border-t bg-muted/30 p-4">
          {item.error && (
            <p className="text-amber-600 text-xs mb-3">
              {item.error} — fill in the fields below.
            </p>
          )}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="space-y-1">
              <Label className="text-xs">Merchant Name</Label>
              <Input
                value={item.receipt.merchantName || ''}
                onChange={(e) => onFieldChange(item.id, 'merchantName', e.target.value)}
                placeholder="e.g. Starbucks"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Date</Label>
              <Input
                type="date"
                value={item.receipt.date || ''}
                onChange={(e) => onFieldChange(item.id, 'date', e.target.value)}
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Amount ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.receipt.amount ?? ''}
                onChange={(e) =>
                  onFieldChange(item.id, 'amount', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Tax ($)</Label>
              <Input
                type="number"
                step="0.01"
                min="0"
                value={item.receipt.taxAmount ?? ''}
                onChange={(e) =>
                  onFieldChange(item.id, 'taxAmount', parseFloat(e.target.value) || 0)
                }
                placeholder="0.00"
                className="h-8 text-sm"
              />
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Category</Label>
              <Select
                value={item.receipt.category || 'Other'}
                onValueChange={(v) => onFieldChange(item.id, 'category', v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c} className="text-sm">
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="text-xs">Payment Method</Label>
              <Select
                value={item.receipt.paymentMethod || 'Credit Card'}
                onValueChange={(v) => onFieldChange(item.id, 'paymentMethod', v)}
              >
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PAYMENT_METHODS.map((m) => (
                    <SelectItem key={m} value={m} className="text-sm">
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 sm:col-span-2 lg:col-span-3">
              <Label className="text-xs">Notes</Label>
              <Input
                value={item.receipt.description || ''}
                onChange={(e) => onFieldChange(item.id, 'description', e.target.value)}
                placeholder="Optional notes..."
                className="h-8 text-sm"
              />
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}
