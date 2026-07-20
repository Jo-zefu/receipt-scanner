import { Receipt } from '../types/receipt';
import { Card } from './ui/card';
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from 'recharts';
import { useTranslation } from 'react-i18next';
import { formatCurrency, getCurrencySymbol } from '../utils/currency';

interface CategoryChartProps {
  receipts: Receipt[];
}

const COLORS = [
  '#3b82f6', // blue
  '#10b981', // green
  '#f59e0b', // orange
  '#ef4444', // red
  '#8b5cf6', // purple
  '#ec4899', // pink
  '#06b6d4', // cyan
  '#84cc16', // lime
  '#f97316', // orange-500
];

export function CategoryChart({ receipts }: CategoryChartProps) {
  const { t } = useTranslation();
  // Calculate totals by category
  const categoryTotals: { [key: string]: number } = {};

  receipts.forEach(receipt => {
    const total = receipt.amount + (receipt.taxAmount || 0);
    categoryTotals[receipt.category] = (categoryTotals[receipt.category] || 0) + total;
  });

  const data = Object.entries(categoryTotals)
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  if (data.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4">{t('dashboard.categoryBreakdown')}</h3>
        <div className="flex items-center justify-center h-64 text-muted-foreground">
          {t('receipts.noReceipts')}
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <h3 className="mb-4">{t('dashboard.categoryBreakdown')}</h3>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${t(`categories.${name}`)} ${(percent * 100).toFixed(0)}%`}
            outerRadius={80}
            fill="#8884d8"
            dataKey="value"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number) => formatCurrency(value)} />
        </PieChart>
      </ResponsiveContainer>

      <div className="mt-6 space-y-2">
        {data.map((item, index) => (
          <div key={item.name} className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: COLORS[index % COLORS.length] }}
              />
              <span className="text-sm">{t(`categories.${item.name}`)}</span>
            </div>
            <span className="text-sm font-medium">{formatCurrency(item.value)}</span>
          </div>
        ))}
      </div>
    </Card>
  );
}
