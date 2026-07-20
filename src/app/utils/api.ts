const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface ApiReceipt {
  id: string;
  filename: string;
  vendor: string | null;
  category: string;
  amount: number | null;
  date: string | null;
  raw_text: string;
  confidence: string;
  image_url: string | null;
  payment_method?: string | null;
  notes?: string | null;
  tax?: number | null;
  created_at: string;
  updated_at?: string;
}

export const api = {
  async scanReceipt(file: File): Promise<ApiReceipt> {
    const formData = new FormData();
    formData.append('image', file);

    const res = await fetch(`${API_BASE}/api/scan`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Scan failed');
    }

    const data = await res.json();
    return data.receipt;
  },

  async scanMultiReceipt(files: File[]): Promise<ApiReceipt> {
    const formData = new FormData();
    files.forEach((file) => formData.append('images', file));

    const res = await fetch(`${API_BASE}/api/scan-multi`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Multi-scan failed');
    }

    const data = await res.json();
    return data.receipt;
  },

  async getAllReceipts(): Promise<ApiReceipt[]> {
    const res = await fetch(`${API_BASE}/api/receipts`);
    if (!res.ok) throw new Error('Failed to fetch receipts');
    const data = await res.json();
    return data.receipts;
  },

  async getReceipt(id: string): Promise<ApiReceipt> {
    const res = await fetch(`${API_BASE}/api/receipts/${id}`);
    if (!res.ok) throw new Error('Receipt not found');
    const data = await res.json();
    return data.receipt;
  },

  async updateReceipt(id: string, updates: Partial<ApiReceipt>): Promise<ApiReceipt> {
    const res = await fetch(`${API_BASE}/api/receipts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates),
    });
    if (!res.ok) throw new Error('Update failed');
    const data = await res.json();
    return data.receipt;
  },

  async deleteReceipt(id: string): Promise<void> {
    const res = await fetch(`${API_BASE}/api/receipts/${id}`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Delete failed');
  },

  async deleteAllReceipts(): Promise<void> {
    const res = await fetch(`${API_BASE}/api/receipts`, {
      method: 'DELETE',
    });
    if (!res.ok) throw new Error('Delete all failed');
  },

  async batchDeleteReceipts(ids: string[]): Promise<void> {
    const res = await fetch(`${API_BASE}/api/receipts/batch-delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ids }),
    });
    if (!res.ok) throw new Error('Batch delete failed');
  },

  async getSummary(): Promise<{ total: number; count: number; byCategory: Record<string, number> }> {
    const res = await fetch(`${API_BASE}/api/summary`);
    if (!res.ok) throw new Error('Failed to fetch summary');
    const data = await res.json();
    return data.summary;
  },
};
