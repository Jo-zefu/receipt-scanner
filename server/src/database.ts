import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase environment variables. Please set SUPABASE_URL and SUPABASE_ANON_KEY in .env');
}

export const supabase: SupabaseClient = createClient(supabaseUrl, supabaseKey);

export interface Receipt {
  id?: string;
  filename: string;
  vendor: string | null;
  category: string;
  amount: number | null;
  date: string | null;
  raw_text: string;
  confidence: string;
  image_url?: string | null;
  payment_method?: string | null;
  notes?: string | null;
  tax?: number | null;
  created_at?: string;
  updated_at?: string;
}

export async function insertReceipt(receipt: Receipt): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .insert([receipt])
    .select()
    .single();

  if (error) throw new Error(`Insert failed: ${error.message}`);
  return data;
}

export async function getAllReceipts(): Promise<Receipt[]> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw new Error(`Fetch failed: ${error.message}`);
  return data || [];
}

export async function getReceiptById(id: string): Promise<Receipt | null> {
  const { data, error } = await supabase
    .from('receipts')
    .select('*')
    .eq('id', id)
    .single();

  if (error) return null;
  return data;
}

export async function updateReceiptById(id: string, updates: Partial<Receipt>): Promise<Receipt> {
  const { data, error } = await supabase
    .from('receipts')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw new Error(`Update failed: ${error.message}`);
  return data;
}

export async function deleteReceiptById(id: string): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .delete()
    .eq('id', id);

  if (error) throw new Error(`Delete failed: ${error.message}`);
}

export async function deleteAllReceipts(): Promise<void> {
  const { error } = await supabase
    .from('receipts')
    .delete()
    .neq('id', '00000000-0000-0000-0000-000000000000'); // delete all

  if (error) throw new Error(`Delete all failed: ${error.message}`);
}

export async function getReceiptSummary(): Promise<{ total: number; count: number; byCategory: Record<string, number> }> {
  const receipts = await getAllReceipts();
  const total = receipts.reduce((sum, r) => sum + (r.amount || 0), 0);
  const byCategory: Record<string, number> = {};

  receipts.forEach(r => {
    const cat = r.category || 'Other';
    byCategory[cat] = (byCategory[cat] || 0) + (r.amount || 0);
  });

  return { total, count: receipts.length, byCategory };
}

export async function uploadImage(fileBuffer: Buffer, filename: string): Promise<string | null> {
  const bucket = 'receipt-images';
  const filePath = `receipts/${Date.now()}_${filename}`;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(filePath, fileBuffer, {
      contentType: 'image/jpeg',
      upsert: false,
    });

  if (error) {
    console.error('Image upload failed:', error.message);
    return null;
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(filePath);
  return data.publicUrl;
}
