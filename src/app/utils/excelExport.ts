import * as XLSX from 'xlsx';
import { Receipt } from '../types/receipt';

export const exportToExcel = (receipts: Receipt[], filename: string = 'receipts.xlsx') => {
  // Prepare data for Excel
  const data = receipts.map(receipt => ({
    'Date': receipt.date,
    'Merchant': receipt.merchantName,
    'Amount': receipt.amount,
    'Tax': receipt.taxAmount || 0,
    'Total': receipt.amount + (receipt.taxAmount || 0),
    'Category': receipt.category,
    'Payment Method': receipt.paymentMethod,
    'Description': receipt.description || '',
    'Created At': new Date(receipt.createdAt).toLocaleDateString()
  }));

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Set column widths
  worksheet['!cols'] = [
    { wch: 12 }, // Date
    { wch: 25 }, // Merchant
    { wch: 10 }, // Amount
    { wch: 10 }, // Tax
    { wch: 10 }, // Total
    { wch: 18 }, // Category
    { wch: 15 }, // Payment Method
    { wch: 30 }, // Description
    { wch: 12 }  // Created At
  ];

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Receipts');

  // Add summary sheet
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount, 0);
  const totalTax = receipts.reduce((sum, r) => sum + (r.taxAmount || 0), 0);
  
  const categoryTotals: { [key: string]: number } = {};
  receipts.forEach(r => {
    categoryTotals[r.category] = (categoryTotals[r.category] || 0) + r.amount;
  });

  const summaryData = [
    { Metric: 'Total Receipts', Value: receipts.length },
    { Metric: 'Total Amount', Value: totalAmount.toFixed(2) },
    { Metric: 'Total Tax', Value: totalTax.toFixed(2) },
    { Metric: 'Grand Total', Value: (totalAmount + totalTax).toFixed(2) },
    { Metric: '', Value: '' },
    { Metric: 'Category Breakdown', Value: '' },
    ...Object.entries(categoryTotals).map(([category, total]) => ({
      Metric: category,
      Value: total.toFixed(2)
    }))
  ];

  const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
  summaryWorksheet['!cols'] = [{ wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Summary');

  // Download file
  XLSX.writeFile(workbook, filename);
};
