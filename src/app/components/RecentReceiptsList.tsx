import { Receipt } from '../types/receipt';
import { Card } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { Eye, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router';

interface RecentReceiptsListProps {
  receipts: Receipt[];
  onDelete?: (id: string) => void;
}

export function RecentReceiptsList({ receipts, onDelete }: RecentReceiptsListProps) {
  const navigate = useNavigate();
  const recentReceipts = receipts.slice(0, 5);

  if (receipts.length === 0) {
    return (
      <Card className="p-6">
        <h3 className="mb-4">Recent Receipts</h3>
        <div className="text-center py-8 text-muted-foreground">
          No receipts yet. Upload your first receipt to get started!
        </div>
      </Card>
    );
  }

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3>Recent Receipts</h3>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate('/receipts')}
        >
          View All
        </Button>
      </div>

      <div className="space-y-3">
        {recentReceipts.map((receipt) => (
          <div
            key={receipt.id}
            className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/50 transition-colors"
          >
            <div className="flex items-center gap-4 flex-1 min-w-0">
              {receipt.imageUrl && (
                <img
                  src={receipt.imageUrl}
                  alt={receipt.merchantName}
                  className="w-12 h-12 rounded object-cover flex-shrink-0"
                />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-medium truncate">{receipt.merchantName}</p>
                <div className="flex items-center gap-2 mt-1">
                  <p className="text-sm text-muted-foreground">{receipt.date}</p>
                  <Badge variant="secondary" className="text-xs">
                    {receipt.category}
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3 ml-4">
              <p className="font-semibold whitespace-nowrap">
                ${(receipt.amount + (receipt.taxAmount || 0)).toFixed(2)}
              </p>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => navigate(`/receipt/${receipt.id}`)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                {onDelete && (
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onDelete(receipt.id)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
