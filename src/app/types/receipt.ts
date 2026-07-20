export interface Receipt {
  id: string;
  merchantName: string;
  date: string;
  amount: number;
  category: string;
  paymentMethod: string;
  description?: string;
  imageUrl?: string;
  rawText?: string;
  items?: ReceiptItem[];
  taxAmount?: number;
  createdAt: string;
}

export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export type Category = 
  | "Food & Dining"
  | "Transportation"
  | "Shopping"
  | "Entertainment"
  | "Healthcare"
  | "Travel"
  | "Office Supplies"
  | "Utilities"
  | "Other";

export type PaymentMethod = "Cash" | "Credit Card" | "Debit Card" | "Digital Wallet" | "Other";
