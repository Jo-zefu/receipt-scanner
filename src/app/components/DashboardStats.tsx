import { Receipt } from '../types/receipt';
import { Card } from './ui/card';
import { DollarSign, FileText, TrendingUp, Calendar } from 'lucide-react';

interface DashboardStatsProps {
  receipts: Receipt[];
}

export function DashboardStats({ receipts }: DashboardStatsProps) {
  const totalAmount = receipts.reduce((sum, r) => sum + r.amount + (r.taxAmount || 0), 0);
  const thisMonthReceipts = receipts.filter(r => {
    const receiptDate = new Date(r.date);
    const now = new Date();
    return receiptDate.getMonth() === now.getMonth() && 
           receiptDate.getFullYear() === now.getFullYear();
  });
  const thisMonthAmount = thisMonthReceipts.reduce((sum, r) => sum + r.amount + (r.taxAmount || 0), 0);
  
  const avgAmount = receipts.length > 0 ? totalAmount / receipts.length : 0;

  const stats = [
    {
      title: 'Total Receipts',
      value: receipts.length.toString(),
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100',
    },
    {
      title: 'Total Amount',
      value: `$${totalAmount.toFixed(2)}`,
      icon: DollarSign,
      color: 'text-green-600',
      bgColor: 'bg-green-100',
    },
    {
      title: 'This Month',
      value: `$${thisMonthAmount.toFixed(2)}`,
      icon: Calendar,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100',
    },
    {
      title: 'Average Amount',
      value: `$${avgAmount.toFixed(2)}`,
      icon: TrendingUp,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, index) => {
        const Icon = stat.icon;
        return (
          <Card key={index} className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
                <p className="text-2xl font-semibold">{stat.value}</p>
              </div>
              <div className={`p-3 rounded-full ${stat.bgColor}`}>
                <Icon className={`w-6 h-6 ${stat.color}`} />
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
