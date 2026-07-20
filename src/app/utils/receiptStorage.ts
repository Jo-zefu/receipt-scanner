import { Receipt } from '../types/receipt';
import { api, ApiReceipt } from './api';

/**
 * Convert API receipt format to frontend Receipt format
 */
function toFrontend(r: ApiReceipt): Receipt {
  return {
    id: r.id,
    merchantName: r.vendor || 'Unknown',
    date: r.date || new Date().toISOString().split('T')[0],
    amount: r.amount || 0,
    category: r.category || 'Other',
    paymentMethod: r.payment_method || 'Other',
    description: r.notes || '',
    imageUrl: r.image_url || undefined,
    rawText: r.raw_text || undefined,
    taxAmount: r.tax || undefined,
    createdAt: r.created_at,
  };
}

/**
 * Convert frontend Receipt format to API update format
 */
function toApi(r: Partial<Receipt>): Partial<ApiReceipt> {
  const result: any = {};
  if (r.merchantName !== undefined) result.vendor = r.merchantName;
  if (r.date !== undefined) result.date = r.date;
  if (r.amount !== undefined) result.amount = r.amount;
  if (r.category !== undefined) result.category = r.category;
  if (r.paymentMethod !== undefined) result.payment_method = r.paymentMethod;
  if (r.description !== undefined) result.notes = r.description;
  if (r.taxAmount !== undefined) result.tax = r.taxAmount;
  return result;
}

export const receiptStorage = {
  async getAll(): Promise<Receipt[]> {
    try {
      const receipts = await api.getAllReceipts();
      return receipts.map(toFrontend);
    } catch (error) {
      console.error('Error loading receipts:', error);
      return [];
    }
  },

  async add(receipt: Receipt): Promise<void> {
    // Receipt is already saved via scan API, this is a no-op
    // Kept for interface compatibility
  },

  async update(id: string, updatedReceipt: Partial<Receipt>): Promise<void> {
    try {
      await api.updateReceipt(id, toApi(updatedReceipt));
    } catch (error) {
      console.error('Error updating receipt:', error);
    }
  },

  async delete(id: string): Promise<void> {
    try {
      await api.deleteReceipt(id);
    } catch (error) {
      console.error('Error deleting receipt:', error);
    }
  },

  async getById(id: string): Promise<Receipt | undefined> {
    try {
      const receipt = await api.getReceipt(id);
      return toFrontend(receipt);
    } catch {
      return undefined;
    }
  }
};
