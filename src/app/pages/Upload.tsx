import { BulkReceiptUpload } from '../components/BulkReceiptUpload';
import { useNavigate } from 'react-router';
import { Receipt } from '../types/receipt';

export function Upload() {
  const navigate = useNavigate();

  const handleAllSaved = (receipts: Receipt[]) => {
    setTimeout(() => navigate('/receipts'), 800);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1>Scan Receipts</h1>
        <p className="text-muted-foreground">
          Upload one or many receipt images at once — OCR extracts the data automatically
        </p>
      </div>

      <BulkReceiptUpload onAllSaved={handleAllSaved} />
    </div>
  );
}
