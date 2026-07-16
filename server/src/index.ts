import express from 'express';
import multer from 'multer';
import cors from 'cors';
import dotenv from 'dotenv';
import { recognizeReceipt, recognizeGeneral } from './baidu-ocr';
import { parseReceipt } from './parser';
import {
  insertReceipt,
  getAllReceipts,
  deleteAllReceipts,
  deleteReceiptById,
  updateReceiptById,
  getReceiptById,
  getReceiptSummary,
  uploadImage,
  Receipt,
} from './database';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
});

// Health check
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Upload and scan receipt
app.post('/api/scan', upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      res.status(400).json({ error: 'No image file provided' });
      return;
    }

    const imageBase64 = req.file.buffer.toString('base64');
    const filename = req.file.originalname;

    // Try receipt OCR first, fallback to general
    let ocrResult: any;
    try {
      ocrResult = await recognizeReceipt(imageBase64);
      // 如果票据识别返回了结构化字段，合并到 _structured
      if (ocrResult.words_result && ocrResult.words_result_num > 0) {
        // receipt API 返回结构化数据
        const structured: any = {};
        if (Array.isArray(ocrResult.words_result)) {
          ocrResult.words_result.forEach((item: any) => {
            if (item.key && item.value) {
              structured[item.key] = item.value;
            }
          });
        }
        if (Object.keys(structured).length > 0) {
          ocrResult._structured = structured;
        }
      }
    } catch (e: any) {
      console.log('Receipt OCR failed, trying general OCR:', e.message);
      ocrResult = await recognizeGeneral(imageBase64);
    }

    // Parse OCR result
    const parsed = parseReceipt(ocrResult, filename);

    // Upload image to Supabase Storage
    const imageUrl = await uploadImage(req.file.buffer, filename);

    // Save to database
    const receipt: Receipt = {
      filename: parsed.filename,
      vendor: parsed.vendor,
      category: parsed.category,
      amount: parsed.amount,
      date: parsed.date,
      raw_text: parsed.rawText,
      confidence: parsed.confidence,
      image_url: imageUrl,
    };

    const saved = await insertReceipt(receipt);

    res.json({
      success: true,
      receipt: saved,
    });
  } catch (error: any) {
    console.error('Scan failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all receipts
app.get('/api/receipts', async (_req, res) => {
  try {
    const receipts = await getAllReceipts();
    res.json({ success: true, receipts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get receipt by ID
app.get('/api/receipts/:id', async (req, res) => {
  try {
    const receipt = await getReceiptById(req.params.id);
    if (!receipt) {
      res.status(404).json({ error: 'Receipt not found' });
      return;
    }
    res.json({ success: true, receipt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Update receipt
app.put('/api/receipts/:id', async (req, res) => {
  try {
    const updated = await updateReceiptById(req.params.id, req.body);
    res.json({ success: true, receipt: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete receipt
app.delete('/api/receipts/:id', async (req, res) => {
  try {
    await deleteReceiptById(req.params.id);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all receipts
app.delete('/api/receipts', async (_req, res) => {
  try {
    await deleteAllReceipts();
    res.json({ success: true, message: 'All receipts deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary
app.get('/api/summary', async (_req, res) => {
  try {
    const summary = await getReceiptSummary();
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🧾 Receipt Scanner API running on port ${PORT}\n`);
});
