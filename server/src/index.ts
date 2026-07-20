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
import { authMiddleware, AuthenticatedRequest } from './auth';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Apply auth middleware to all /api routes
app.use('/api', authMiddleware);

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
app.post('/api/scan', upload.single('image'), async (req: AuthenticatedRequest, res) => {
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
      console.log('Receipt OCR raw response keys:', JSON.stringify(Object.keys(ocrResult)));
      console.log('Receipt OCR words_result sample:', JSON.stringify((ocrResult.words_result || []).slice(0, 3)));

      if (ocrResult.words_result) {
        const structured: any = {};

        if (Array.isArray(ocrResult.words_result)) {
          ocrResult.words_result.forEach((item: any) => {
            if (item.key && item.value) {
              structured[item.key] = item.value;
            }
          });
        } else if (typeof ocrResult.words_result === 'object') {
          Object.assign(structured, ocrResult.words_result);
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
      user_id: req.userId || null,
    };

    const saved = await insertReceipt(receipt);

    res.json({
      success: true,
      receipt: saved,
    });
  } catch (error: any) {
    console.error('Scan failed:', error.message, error.response?.status, error.response?.data);
    res.status(500).json({ error: error.message });
  }
});

// Scan multiple images (long receipt) and merge OCR results
app.post('/api/scan-multi', upload.array('images', 10), async (req: AuthenticatedRequest, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      res.status(400).json({ error: 'No image files provided' });
      return;
    }

    console.log(`Processing ${files.length} images for long receipt scan`);

    // OCR all images in parallel
    const ocrResults = await Promise.all(
      files.map(async (file) => {
        const imageBase64 = file.buffer.toString('base64');
        try {
          return await recognizeReceipt(imageBase64);
        } catch {
          return await recognizeGeneral(imageBase64);
        }
      })
    );

    // Merge all OCR results into one
    const mergedResult: any = { words_result: [], words_result_num: 0 };
    const allStructured: any = {};

    for (const result of ocrResults) {
      if (Array.isArray(result.words_result)) {
        for (const item of result.words_result) {
          mergedResult.words_result.push(item);
          if (item.key && item.value) {
            allStructured[item.key] = item.value;
          }
        }
      }
    }

    mergedResult.words_result_num = mergedResult.words_result.length;
    if (Object.keys(allStructured).length > 0) {
      mergedResult._structured = allStructured;
    }

    // Parse merged result
    const filename = files[0].originalname;
    const parsed = parseReceipt(mergedResult, filename);

    // Upload first image as representative
    const imageUrl = await uploadImage(files[0].buffer, filename);

    const receipt: Receipt = {
      filename: parsed.filename,
      vendor: parsed.vendor,
      category: parsed.category,
      amount: parsed.amount,
      date: parsed.date,
      raw_text: parsed.rawText,
      confidence: parsed.confidence,
      image_url: imageUrl,
      user_id: req.userId || null,
    };

    const saved = await insertReceipt(receipt);

    res.json({
      success: true,
      receipt: saved,
      pages: files.length,
    });
  } catch (error: any) {
    console.error('Multi-scan failed:', error.message);
    res.status(500).json({ error: error.message });
  }
});

// Get all receipts
app.get('/api/receipts', async (req: AuthenticatedRequest, res) => {
  try {
    const receipts = await getAllReceipts(req.userId);
    res.json({ success: true, receipts });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get receipt by ID
app.get('/api/receipts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const receipt = await getReceiptById(req.params.id, req.userId);
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
app.put('/api/receipts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    const updated = await updateReceiptById(req.params.id, req.body, req.userId);
    res.json({ success: true, receipt: updated });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete receipt
app.delete('/api/receipts/:id', async (req: AuthenticatedRequest, res) => {
  try {
    await deleteReceiptById(req.params.id, req.userId);
    res.json({ success: true, message: 'Deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Delete all receipts
app.delete('/api/receipts', async (req: AuthenticatedRequest, res) => {
  try {
    await deleteAllReceipts(req.userId);
    res.json({ success: true, message: 'All receipts deleted' });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Batch delete receipts
app.post('/api/receipts/batch-delete', async (req: AuthenticatedRequest, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      res.status(400).json({ error: 'Invalid ids array' });
      return;
    }

    await Promise.all(ids.map(id => deleteReceiptById(id, req.userId)));
    res.json({ success: true, message: `Deleted ${ids.length} receipts` });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// Get summary
app.get('/api/summary', async (req: AuthenticatedRequest, res) => {
  try {
    const summary = await getReceiptSummary(req.userId);
    res.json({ success: true, summary });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(Number(PORT), '0.0.0.0', () => {
  console.log(`\n🧾 Receipt Scanner API running on port ${PORT}\n`);
});
