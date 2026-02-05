import Meter from '../../models/Meter';
import OcrCache from '../../models/OcrCache';
import User from '../../models/User';
import { processOcrScan } from '../../lib/ocrService';
import { decrypt } from '../../lib/encryption';
import { RouteParams } from '../utils';

async function getGeminiApiKey(userId: string): Promise<string | undefined> {
  const user = await User.findById(userId);
  const key = user?.googleApiKey ? decrypt(user.googleApiKey) : undefined;
  return key || process.env.GOOGLE_API_KEY;
}

export async function handleOcrScan({ req, res, userId }: RouteParams) {
  if (req.method !== 'POST') {return;}

  const { image } = req.body as { image?: string };
  if (!image) {
    res.statusCode = 400;
    res.end(JSON.stringify({ error: 'Image required (base64)' }));
    return;
  }

  const apiKey = await getGeminiApiKey(userId);
  if (!apiKey) {
    res.statusCode = 503;
    res.end(JSON.stringify({ error: 'Gemini OCR not configured. Set GOOGLE_API_KEY in Profile Settings.' }));
    return;
  }

  try {
    const result = await processOcrScan(image, userId, apiKey, { Meter, OcrCache });
    res.end(JSON.stringify(result));
  } catch (e) {
    console.error('Gemini OCR Error:', e);
    res.statusCode = 502;
    res.end(JSON.stringify({ error: e instanceof Error ? e.message : 'OCR failed' }));
  }
}
