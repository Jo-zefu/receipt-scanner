import { Receipt } from '../types/receipt';

export const sampleReceipts: Receipt[] = [
  {
    id: 'sample-1',
    merchantName: 'Whole Foods Market',
    date: '2026-07-14',
    amount: 87.45,
    taxAmount: 7.02,
    category: 'Food & Dining',
    paymentMethod: 'Credit Card',
    description: 'Weekly grocery shopping',
    createdAt: '2026-07-14T10:30:00Z',
  },
  {
    id: 'sample-2',
    merchantName: 'Uber',
    date: '2026-07-13',
    amount: 24.50,
    taxAmount: 2.15,
    category: 'Transportation',
    paymentMethod: 'Digital Wallet',
    description: 'Ride to downtown',
    createdAt: '2026-07-13T18:45:00Z',
  },
  {
    id: 'sample-3',
    merchantName: 'Amazon',
    date: '2026-07-12',
    amount: 156.99,
    taxAmount: 12.56,
    category: 'Shopping',
    paymentMethod: 'Credit Card',
    description: 'Office supplies and books',
    createdAt: '2026-07-12T14:20:00Z',
  },
  {
    id: 'sample-4',
    merchantName: 'Starbucks',
    date: '2026-07-11',
    amount: 12.75,
    taxAmount: 1.02,
    category: 'Food & Dining',
    paymentMethod: 'Digital Wallet',
    description: 'Morning coffee',
    createdAt: '2026-07-11T08:15:00Z',
  },
  {
    id: 'sample-5',
    merchantName: 'AMC Theatres',
    date: '2026-07-10',
    amount: 45.00,
    taxAmount: 3.60,
    category: 'Entertainment',
    paymentMethod: 'Credit Card',
    description: 'Movie tickets and popcorn',
    createdAt: '2026-07-10T19:30:00Z',
  },
  {
    id: 'sample-6',
    merchantName: 'CVS Pharmacy',
    date: '2026-07-08',
    amount: 32.89,
    taxAmount: 2.63,
    category: 'Healthcare',
    paymentMethod: 'Debit Card',
    description: 'Prescription and vitamins',
    createdAt: '2026-07-08T16:45:00Z',
  },
  {
    id: 'sample-7',
    merchantName: 'Shell Gas Station',
    date: '2026-07-05',
    amount: 65.00,
    taxAmount: 5.20,
    category: 'Transportation',
    paymentMethod: 'Credit Card',
    description: 'Fuel',
    createdAt: '2026-07-05T12:00:00Z',
  },
  {
    id: 'sample-8',
    merchantName: 'Target',
    date: '2026-06-28',
    amount: 123.45,
    taxAmount: 9.88,
    category: 'Shopping',
    paymentMethod: 'Credit Card',
    description: 'Household items',
    createdAt: '2026-06-28T15:30:00Z',
  },
];

export const initializeSampleData = () => {
  const STORAGE_KEY = 'receipts';
  const existing = localStorage.getItem(STORAGE_KEY);
  
  // Only add sample data if no receipts exist
  if (!existing || JSON.parse(existing).length === 0) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sampleReceipts));
  }
};
