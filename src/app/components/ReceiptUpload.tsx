import { useState, useRef, useCallback } from 'react';
import { Upload, Camera, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { api } from '../utils/api';
import { Receipt } from '../types/receipt';
import { toast } from 'sonner';
import { formatCurrency } from '../utils/currency';

interface ReceiptUploadProps {
  onUploadComplete?: (receipt: Receipt) => void;
}

export function ReceiptUpload({ onUploadComplete }: ReceiptUploadProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [preview, setPreview] = useState<string | null>(null);
  const [processedReceipt, setProcessedReceipt] = useState<Receipt | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const files = Array.from(e.dataTransfer.files);
    const imageFile = files.find(file => file.type.startsWith('image/'));

    if (imageFile) {
      processFile(imageFile);
    }
  }, []);

  const processFile = async (file: File) => {
    setIsProcessing(true);
    setProgress(10);

    // Create preview
    const reader = new FileReader();
    reader.onload = (e) => {
      setPreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);

    setProgress(30);

    try {
      // Process with OCR via backend API
      const result = await api.scanReceipt(file);
      setProgress(80);

      // Create receipt object from API response
      const newReceipt: Receipt = {
        id: result.id,
        merchantName: result.vendor || 'Unknown',
        date: result.date || new Date().toISOString().split('T')[0],
        amount: result.amount || 0,
        category: result.category || 'Other',
        paymentMethod: 'Credit Card',
        description: '',
        imageUrl: result.image_url || undefined,
        createdAt: result.created_at,
      };

      setProgress(100);
      setProcessedReceipt(newReceipt);

      // Already saved to DB via scan API

      toast.success('Receipt processed successfully!');

      if (onUploadComplete) {
        onUploadComplete(newReceipt);
      }

    } catch (error) {
      console.error('Error processing receipt:', error);
      toast.error('Failed to process receipt. Please try again.');
    } finally {
      setIsProcessing(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const fileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const resetUpload = () => {
    setPreview(null);
    setProcessedReceipt(null);
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (cameraInputRef.current) cameraInputRef.current.value = '';
  };

  return (
    <div className="space-y-6">
      {!preview ? (
        <Card
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed transition-all ${
            isDragging
              ? 'border-primary bg-primary/5'
              : 'border-muted-foreground/25 hover:border-primary/50'
          }`}
        >
          <div className="p-12 text-center">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-primary/10 rounded-full">
                <Upload className="w-12 h-12 text-primary" />
              </div>
            </div>

            <h3 className="mb-2">Upload Receipt Image</h3>
            <p className="text-muted-foreground mb-6">
              Drag and drop your receipt image here, or click to browse
            </p>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={() => fileInputRef.current?.click()}
                variant="default"
              >
                <Upload className="mr-2 h-4 w-4" />
                Choose File
              </Button>

              <Button
                onClick={() => cameraInputRef.current?.click()}
                variant="outline"
              >
                <Camera className="mr-2 h-4 w-4" />
                Take Photo
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />

            <input
              ref={cameraInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            <p className="text-sm text-muted-foreground mt-4">
              Supports: JPG, PNG, HEIC
            </p>
          </div>
        </Card>
      ) : (
        <Card className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <h3 className="mb-4">Receipt Image</h3>
              <img
                src={preview}
                alt="Receipt preview"
                className="w-full rounded-lg border object-contain max-h-96"
              />
            </div>

            <div>
              <h3 className="mb-4">Processing Status</h3>

              {isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3">
                    <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    <span>Scanning receipt...</span>
                  </div>
                  <Progress value={progress} className="w-full" />
                </div>
              )}

              {processedReceipt && !isProcessing && (
                <div className="space-y-4">
                  <div className="flex items-center gap-3 text-green-600">
                    <CheckCircle2 className="h-5 w-5" />
                    <span>Receipt processed successfully!</span>
                  </div>

                  <div className="bg-muted/50 rounded-lg p-4 space-y-2">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Merchant:</span>
                      <span>{processedReceipt.merchantName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Date:</span>
                      <span>{processedReceipt.date}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Amount:</span>
                      <span className="font-semibold">
                        {formatCurrency(processedReceipt.amount)}
                      </span>
                    </div>
                    {processedReceipt.taxAmount && (
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Tax:</span>
                        <span>{formatCurrency(processedReceipt.taxAmount)}</span>
                      </div>
                    )}
                  </div>

                  <Button onClick={resetUpload} className="w-full" variant="outline">
                    Upload Another Receipt
                  </Button>
                </div>
              )}
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
