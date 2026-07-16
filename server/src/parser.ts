export interface ParsedReceipt {
  filename: string;
  vendor: string | null;
  category: string;
  amount: number | null;
  date: string | null;
  rawText: string;
  confidence: 'high' | 'low';
  imagePath?: string;
}

/**
 * 从 OCR 结果中提取金额
 */
export function extractAmount(ocrResult: any): { amount: number | null; confidence: 'high' | 'low' } {
  // 优先使用结构化数据
  if (ocrResult._structured) {
    const s = ocrResult._structured;
    const totalFields = ['total_amount', 'total', 'amount', 'price', 'TotalAmount', 'Total'];
    for (const field of totalFields) {
      if (s[field]) {
        const val = parseFloat(String(s[field]).replace(/[^0-9.]/g, ''));
        if (!isNaN(val) && val > 0) {
          return { amount: val, confidence: 'high' };
        }
      }
    }
  }

  // 从文字中提取
  const words = (ocrResult.words_result || []).map((w: any) => w.words).join('\n');

  // 匹配"合计"、"总计"、"Total"等关键词后面的金额
  const totalPatterns = [
    /(?:合计|总计|总额|实付|应付|实收|Total|Amount|Sum)[：:\s]*[¥￥$]?\s*(\d+\.?\d*)/i,
    /[¥￥$]\s*(\d+\.?\d*)/,
    /(\d+\.\d{2})/,
  ];

  for (const pattern of totalPatterns) {
    const match = words.match(pattern);
    if (match) {
      const val = parseFloat(match[1]);
      if (!isNaN(val) && val > 0 && val < 1000000) {
        return { amount: val, confidence: pattern === totalPatterns[0] ? 'high' : 'low' };
      }
    }
  }

  return { amount: null, confidence: 'low' };
}

/**
 * 提取商家名称
 */
export function extractVendor(ocrResult: any): string | null {
  if (ocrResult._structured) {
    const s = ocrResult._structured;
    const vendorFields = ['shop_name', 'seller_name', 'merchant', 'company'];
    for (const field of vendorFields) {
      if (s[field]) return String(s[field]);
    }
  }

  const words = (ocrResult.words_result || []).map((w: any) => w.words);
  // 通常商家名在前几行
  for (let i = 0; i < Math.min(5, words.length); i++) {
    const line = words[i];
    if (line.length > 4 && line.length < 40 && !line.match(/^\d/) && !line.match(/^[¥￥$]/)) {
      return line;
    }
  }

  return null;
}

/**
 * 提取日期
 */
export function extractDate(ocrResult: any): string | null {
  if (ocrResult._structured) {
    const s = ocrResult._structured;
    const dateFields = ['date', 'trade_date', 'time', 'print_time'];
    for (const field of dateFields) {
      if (s[field]) {
        const dateStr = String(s[field]);
        const match = dateStr.match(/(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/);
        if (match) {
          return `${match[1]}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
        }
      }
    }
  }

  const words = (ocrResult.words_result || []).map((w: any) => w.words).join(' ');

  const datePatterns = [
    /(\d{4})[年/-](\d{1,2})[月/-](\d{1,2})/,
    /(\d{2})[/-](\d{1,2})[/-](\d{1,2})/,
  ];

  for (const pattern of datePatterns) {
    const match = words.match(pattern);
    if (match) {
      const year = match[1].length === 2 ? `20${match[1]}` : match[1];
      return `${year}-${match[2].padStart(2, '0')}-${match[3].padStart(2, '0')}`;
    }
  }

  return null;
}

/**
 * 分类
 */
export function categorize(ocrResult: any): string {
  const words = (ocrResult.words_result || []).map((w: any) => w.words).join(' ').toLowerCase();

  const categories: Record<string, string[]> = {
    'Food & Dining': ['餐', '食', '饭', '咖啡', '奶茶', '超市', '便利店', 'restaurant', 'food', 'coffee', 'cafe', 'market'],
    'Transportation': ['出租', '打车', '地铁', '公交', '滴滴', '加油', '停车', 'taxi', 'uber', 'gas', 'parking', 'transit'],
    'Shopping': ['商城', '商店', '购物', '淘宝', '京东', '服装', 'mall', 'shop', 'store', 'amazon'],
    'Entertainment': ['电影', '游戏', '娱乐', '门票', 'movie', 'game', 'entertainment', 'ticket'],
    'Healthcare': ['药', '医院', '诊所', '健康', 'pharmacy', 'hospital', 'health', 'medical'],
    'Travel': ['酒店', '旅馆', '航班', '机票', 'hotel', 'flight', 'airbnb', 'booking'],
    'Office Supplies': ['办公', '文具', '打印', 'office', 'stationery', 'print'],
    'Utilities': ['电费', '水费', '网费', '话费', 'electric', 'water', 'internet', 'phone'],
  };

  for (const [category, keywords] of Object.entries(categories)) {
    for (const keyword of keywords) {
      if (words.includes(keyword)) {
        return category;
      }
    }
  }

  return 'Other';
}

/**
 * 解析 OCR 结果为结构化数据
 */
export function parseReceipt(ocrResult: any, filename: string): ParsedReceipt {
  const { amount, confidence } = extractAmount(ocrResult);
  const vendor = extractVendor(ocrResult);
  const date = extractDate(ocrResult);
  const category = categorize(ocrResult);
  const rawText = (ocrResult.words_result || [])
    .map((w: any) => w.words)
    .join(' ');

  return {
    filename,
    vendor,
    category,
    amount,
    date,
    rawText,
    confidence,
  };
}
