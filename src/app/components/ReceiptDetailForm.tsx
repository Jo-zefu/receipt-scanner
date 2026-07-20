import { useState } from 'react';
import { Receipt, Category, PaymentMethod } from '../types/receipt';
import { Card } from './ui/card';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Button } from './ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import { Save, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router';
import { useTranslation } from 'react-i18next';
import { formatCurrency } from '../utils/currency';

interface ReceiptDetailFormProps {
  receipt: Receipt;
  onSave: (receipt: Receipt) => void;
}

const categories: Category[] = [
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

const paymentMethods: PaymentMethod[] = [
  'Cash',
  'Credit Card',
  'Debit Card',
  'Digital Wallet',
  'Other',
];

export function ReceiptDetailForm({ receipt, onSave }: ReceiptDetailFormProps) {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [formData, setFormData] = useState(receipt);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  const handleChange = (field: keyof Receipt, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          {t('detail.backToList')}
        </Button>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Receipt Image */}
        {formData.imageUrl && (
          <Card className="p-6">
            <h3 className="mb-4">{t('detail.title')}</h3>
            <img
              src={formData.imageUrl}
              alt="Receipt"
              className="w-full rounded-lg border object-contain max-h-[600px]"
            />
          </Card>
        )}

        {/* Form */}
        <Card className="p-6">
          <h3 className="mb-6">{t('edit.title')}</h3>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="merchantName">{t('edit.merchantName')} *</Label>
              <Input
                id="merchantName"
                value={formData.merchantName}
                onChange={(e) => handleChange('merchantName', e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="date">{t('edit.date')} *</Label>
                <Input
                  id="date"
                  type="date"
                  value={formData.date}
                  onChange={(e) => handleChange('date', e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="amount">{t('edit.amount')} *</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={formData.amount}
                  onChange={(e) => handleChange('amount', parseFloat(e.target.value) || 0)}
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">{t('edit.category')} *</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => handleChange('category', value)}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map(category => (
                      <SelectItem key={category} value={category}>
                        {t(`categories.${category}`)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="taxAmount">{t('edit.tax')}</Label>
                <Input
                  id="taxAmount"
                  type="number"
                  step="0.01"
                  value={formData.taxAmount || 0}
                  onChange={(e) => handleChange('taxAmount', parseFloat(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="paymentMethod">{t('edit.paymentMethod')} *</Label>
              <Select
                value={formData.paymentMethod}
                onValueChange={(value) => handleChange('paymentMethod', value)}
              >
                <SelectTrigger id="paymentMethod">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {paymentMethods.map(method => (
                    <SelectItem key={method} value={method}>
                      {t(`payment.${method}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">{t('edit.notes')}</Label>
              <Textarea
                id="description"
                value={formData.description || ''}
                onChange={(e) => handleChange('description', e.target.value)}
                rows={4}
                placeholder={t('edit.notesPlaceholder')}
              />
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">{t('detail.subtotal')}:</span>
                <span className="font-medium">{formatCurrency(formData.amount)}</span>
              </div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-muted-foreground">{t('detail.tax')}:</span>
                <span className="font-medium">{formatCurrency(formData.taxAmount || 0)}</span>
              </div>
              <div className="flex justify-between items-center text-lg">
                <span>{t('detail.total')}:</span>
                <span className="font-semibold">
                  {formatCurrency((formData.amount || 0) + (formData.taxAmount || 0))}
                </span>
              </div>
            </div>

            <Button type="submit" className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {t('edit.save')}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
