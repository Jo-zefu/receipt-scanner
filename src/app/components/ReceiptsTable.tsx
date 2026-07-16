import { useState } from 'react';
import { Receipt, Category, PaymentMethod } from '../types/receipt';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from './ui/table';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Badge } from './ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from './ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from './ui/dialog';
import { Eye, Trash2, Search, Download, Pencil, Save, X } from 'lucide-react';
import { useNavigate } from 'react-router';
import { exportToExcel } from '../utils/excelExport';

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

interface ReceiptsTableProps {
  receipts: Receipt[];
  onDelete?: (id: string) => void;
  onUpdate?: (id: string, receipt: Receipt) => void;
}

export function ReceiptsTable({ receipts, onDelete, onUpdate }: ReceiptsTableProps) {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'amount'>('date');
  const [editingReceipt, setEditingReceipt] = useState<Receipt | null>(null);
  const [editForm, setEditForm] = useState<Receipt | null>(null);

  const categories = Array.from(new Set(receipts.map((r) => r.category)));

  const filteredReceipts = receipts
    .filter((receipt) => {
      const matchesSearch =
        receipt.merchantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        receipt.description?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory =
        categoryFilter === 'all' || receipt.category === categoryFilter;
      return matchesSearch && matchesCategory;
    })
    .sort((a, b) => {
      if (sortBy === 'date') {
        return new Date(b.date).getTime() - new Date(a.date).getTime();
      }
      return b.amount + (b.taxAmount || 0) - (a.amount + (a.taxAmount || 0));
    });

  const openEdit = (receipt: Receipt) => {
    setEditingReceipt(receipt);
    setEditForm({ ...receipt });
  };

  const closeEdit = () => {
    setEditingReceipt(null);
    setEditForm(null);
  };

  const handleEditChange = (field: keyof Receipt, value: unknown) => {
    setEditForm((prev) => (prev ? { ...prev, [field]: value } : prev));
  };

  const handleSaveEdit = () => {
    if (editForm && editingReceipt && onUpdate) {
      onUpdate(editingReceipt.id, editForm);
    }
    closeEdit();
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search receipts..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>

        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select
          value={sortBy}
          onValueChange={(value: 'date' | 'amount') => setSortBy(value)}
        >
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="date">Sort by Date</SelectItem>
            <SelectItem value="amount">Sort by Amount</SelectItem>
          </SelectContent>
        </Select>

        <Button onClick={() => exportToExcel(filteredReceipts)} variant="default">
          <Download className="mr-2 h-4 w-4" />
          Export Excel
        </Button>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Merchant</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Payment</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead className="text-right">Tax</TableHead>
              <TableHead className="text-right">Total</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredReceipts.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={8}
                  className="text-center py-8 text-muted-foreground"
                >
                  No receipts found
                </TableCell>
              </TableRow>
            ) : (
              filteredReceipts.map((receipt) => (
                <TableRow key={receipt.id}>
                  <TableCell className="whitespace-nowrap">{receipt.date}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {receipt.imageUrl && (
                        <img
                          src={receipt.imageUrl}
                          alt={receipt.merchantName}
                          className="w-8 h-8 rounded object-cover flex-shrink-0"
                        />
                      )}
                      <span className="truncate max-w-[160px]">
                        {receipt.merchantName}
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">{receipt.category}</Badge>
                  </TableCell>
                  <TableCell className="whitespace-nowrap">
                    {receipt.paymentMethod}
                  </TableCell>
                  <TableCell className="text-right">
                    ${receipt.amount.toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    ${(receipt.taxAmount || 0).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right font-semibold">
                    ${(receipt.amount + (receipt.taxAmount || 0)).toFixed(2)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="Quick edit"
                        onClick={() => openEdit(receipt)}
                      >
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-7 w-7"
                        title="View detail"
                        onClick={() => navigate(`/receipt/${receipt.id}`)}
                      >
                        <Eye className="h-3.5 w-3.5" />
                      </Button>
                      {onDelete && (
                        <Button
                          size="icon"
                          variant="ghost"
                          className="h-7 w-7"
                          title="Delete"
                          onClick={() => onDelete(receipt.id)}
                        >
                          <Trash2 className="h-3.5 w-3.5 text-destructive" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Summary */}
      {filteredReceipts.length > 0 && (
        <div className="flex justify-end gap-8 p-4 bg-muted rounded-lg">
          <div>
            <p className="text-sm text-muted-foreground">Total Receipts</p>
            <p className="text-lg font-semibold">{filteredReceipts.length}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Total Amount</p>
            <p className="text-lg font-semibold">
              $
              {filteredReceipts
                .reduce((sum, r) => sum + r.amount + (r.taxAmount || 0), 0)
                .toFixed(2)}
            </p>
          </div>
        </div>
      )}

      {/* Inline Edit Dialog */}
      <Dialog open={!!editingReceipt} onOpenChange={(open) => !open && closeEdit()}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit Receipt</DialogTitle>
          </DialogHeader>

          {editForm && (
            <div className="space-y-4 py-2">
              {editForm.imageUrl && (
                <img
                  src={editForm.imageUrl}
                  alt="Receipt"
                  className="w-full max-h-48 object-contain rounded-lg border"
                />
              )}

              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1.5">
                  <Label>Merchant Name</Label>
                  <Input
                    value={editForm.merchantName}
                    onChange={(e) => handleEditChange('merchantName', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Date</Label>
                  <Input
                    type="date"
                    value={editForm.date}
                    onChange={(e) => handleEditChange('date', e.target.value)}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Amount ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.amount}
                    onChange={(e) =>
                      handleEditChange('amount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Tax ($)</Label>
                  <Input
                    type="number"
                    step="0.01"
                    min="0"
                    value={editForm.taxAmount ?? 0}
                    onChange={(e) =>
                      handleEditChange('taxAmount', parseFloat(e.target.value) || 0)
                    }
                  />
                </div>

                <div className="space-y-1.5">
                  <Label>Category</Label>
                  <Select
                    value={editForm.category}
                    onValueChange={(v) => handleEditChange('category', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {CATEGORIES.map((c) => (
                        <SelectItem key={c} value={c}>
                          {c}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label>Payment Method</Label>
                  <Select
                    value={editForm.paymentMethod}
                    onValueChange={(v) => handleEditChange('paymentMethod', v)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PAYMENT_METHODS.map((m) => (
                        <SelectItem key={m} value={m}>
                          {m}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="col-span-2 space-y-1.5">
                  <Label>Notes</Label>
                  <Textarea
                    value={editForm.description || ''}
                    onChange={(e) => handleEditChange('description', e.target.value)}
                    rows={2}
                    placeholder="Optional notes..."
                  />
                </div>
              </div>

              <div className="pt-2 border-t flex justify-between text-sm">
                <span className="text-muted-foreground">Total</span>
                <span className="font-semibold">
                  ${(editForm.amount + (editForm.taxAmount || 0)).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={closeEdit}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={handleSaveEdit}>
              <Save className="mr-2 h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
