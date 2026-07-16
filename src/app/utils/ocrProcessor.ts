import { createWorker } from 'tesseract.js';

export interface OCRResult {
  merchantName: string;
  date: string;
  amount: number;
  taxAmount?: number;
  items?: Array<{ name: string; price: number }>;
}

export const processReceiptImage = async (imageFile: File): Promise<OCRResult> => {
  const worker = await createWorker('eng');
  
  try {
    const { data: { text } } = await worker.recognize(imageFile);
    
    // Parse the OCR text to extract receipt information
    const result = parseReceiptText(text);
    
    return result;
  } finally {
    await worker.terminate();
  }
};

const parseReceiptText = (text: string): OCRResult => {
  // Basic parsing logic - this can be enhanced with more sophisticated patterns
  const lines = text.split('\n').filter(line => line.trim());
  
  // Extract merchant name (usually first few lines)
  const merchantName = lines[0]?.trim() || 'Unknown Merchant';
  
  // Extract date
  const datePattern = /(\d{1,2}[\/\-\.]\d{1,2}[\/\-\.]\d{2,4})/;
  const dateMatch = text.match(datePattern);
  const date = dateMatch ? formatDate(dateMatch[1]) : new Date().toISOString().split('T')[0];
  
  // Extract total amount
  const totalPattern = /total[:\s]*[\$]?\s*(\d+[.,]\d{2})/i;
  const totalMatch = text.match(totalPattern);
  const amount = totalMatch ? parseFloat(totalMatch[1].replace(',', '.')) : 0;
  
  // Extract tax
  const taxPattern = /tax[:\s]*[\$]?\s*(\d+[.,]\d{2})/i;
  const taxMatch = text.match(taxPattern);
  const taxAmount = taxMatch ? parseFloat(taxMatch[1].replace(',', '.')) : undefined;
  
  // Extract items (basic pattern)
  const items: Array<{ name: string; price: number }> = [];
  const itemPattern = /(.+?)\s+[\$]?\s*(\d+[.,]\d{2})/g;
  let itemMatch;
  
  while ((itemMatch = itemPattern.exec(text)) !== null) {
    const name = itemMatch[1].trim();
    const price = parseFloat(itemMatch[2].replace(',', '.'));
    
    // Filter out lines that look like totals or headers
    if (!name.toLowerCase().includes('total') && 
        !name.toLowerCase().includes('subtotal') &&
        !name.toLowerCase().includes('tax') &&
        name.length > 2) {
      items.push({ name, price });
    }
  }
  
  return {
    merchantName,
    date,
    amount,
    taxAmount,
    items: items.length > 0 ? items.slice(0, 10) : undefined // Limit to 10 items
  };
};

const formatDate = (dateStr: string): string => {
  // Convert various date formats to YYYY-MM-DD
  const parts = dateStr.split(/[\/\-\.]/);
  
  if (parts.length === 3) {
    let [first, second, third] = parts;
    
    // Assume MM/DD/YYYY or DD/MM/YYYY format
    if (third.length === 4) {
      const year = third;
      const month = first.length === 2 ? first : second;
      const day = first.length === 2 ? second : first;
      return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
    } else if (first.length === 4) {
      // YYYY/MM/DD format
      return `${first}-${second.padStart(2, '0')}-${third.padStart(2, '0')}`;
    } else {
      // MM/DD/YY format - assume 20YY
      const year = `20${third}`;
      return `${year}-${first.padStart(2, '0')}-${second.padStart(2, '0')}`;
    }
  }
  
  return new Date().toISOString().split('T')[0];
};
