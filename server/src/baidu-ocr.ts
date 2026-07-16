import axios from 'axios';

let cachedToken: string | null = null;
let tokenExpiry: number = 0;

export async function getAccessToken(): Promise<string> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken;
  }

  const apiKey = process.env.BAIDU_API_KEY;
  const secretKey = process.env.BAIDU_SECRET_KEY;

  if (!apiKey || !secretKey) {
    throw new Error('缺少 BAIDU_API_KEY 或 BAIDU_SECRET_KEY 环境变量');
  }

  const res = await axios.post(
    'https://aip.baidubce.com/oauth/2.0/token',
    null,
    {
      params: {
        grant_type: 'client_credentials',
        client_id: apiKey,
        client_secret: secretKey,
      },
    }
  );

  cachedToken = res.data.access_token;
  tokenExpiry = Date.now() + 29 * 24 * 60 * 60 * 1000; // 29天
  return cachedToken!;
}

/**
 * 票据识别（高精度）
 */
export async function recognizeReceipt(imageBase64: string): Promise<any> {
  const token = await getAccessToken();

  const res = await axios.post(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/receipt?access_token=${token}`,
    `image=${encodeURIComponent(imageBase64)}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  if (res.data.error_code) {
    throw new Error(`百度票据OCR错误 [${res.data.error_code}]: ${res.data.error_msg}`);
  }

  return res.data;
}

/**
 * 通用文字识别（高精度）- 作为 fallback
 */
export async function recognizeGeneral(imageBase64: string): Promise<any> {
  const token = await getAccessToken();

  const res = await axios.post(
    `https://aip.baidubce.com/rest/2.0/ocr/v1/accurate_basic?access_token=${token}`,
    `image=${encodeURIComponent(imageBase64)}`,
    {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    }
  );

  if (res.data.error_code) {
    throw new Error(`百度通用OCR错误 [${res.data.error_code}]: ${res.data.error_msg}`);
  }

  return res.data;
}
