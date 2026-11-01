import { parseCsv } from '../csvParser';
import { extractPdfText } from './geminiDocument';

export interface ExtractedReading {
  date: string;
  value: number;
  unit?: string;
  confidence?: number;
}

export interface ExtractedBill {
  periodStart?: string;
  periodEnd?: string;
  consumption?: number;
  unit?: string;
  amountGross?: number;
  amountNet?: number;
  currency?: string;
}

export interface ExtractedDocument {
  providerName?: string;
  meterNumber?: string;
  readings: ExtractedReading[];
  bill?: ExtractedBill;
  notes?: string;
}

export const MAX_READINGS = 2000;

const DATE_KEYS = ['datum', 'date', 'zeitpunkt', 'zeit', 'tag', 'von', 'ablesedatum', 'stichtag'];
const VALUE_KEYS = ['zaehlerstand', 'zählerstand', 'stand', 'wert', 'value', 'reading', 'kwh', 'verbrauch', 'menge'];
const UNIT_KEYS = ['einheit', 'unit', 'masseinheit', 'maßeinheit'];

function normalizeHeader(value: string): string {
  return value.trim().toLowerCase().replace(/\s+/g, '');
}

function findKey(headers: string[], candidates: string[]): string | undefined {
  return headers.find((h) => candidates.some((c) => normalizeHeader(h).includes(c)));
}

export function parseFlexibleNumber(raw: string | number | undefined | null): number | undefined {
  if (typeof raw === 'number') {
    return Number.isFinite(raw) ? raw : undefined;
  }
  if (!raw) {
    return undefined;
  }
  const cleaned = raw
    .replace(/\s/g, '')
    .replace(/[^\d.,-]/g, '')
    .replace(/\.(?=\d{3}\b)/g, '')
    .replace(',', '.');
  const value = Number.parseFloat(cleaned);
  return Number.isFinite(value) ? value : undefined;
}

/** Accepts DD.MM.YYYY, DD/MM/YYYY, YYYY-MM-DD and ISO timestamps. */
export function parseFlexibleDate(raw: string | undefined | null): string | undefined {
  if (!raw) {
    return undefined;
  }
  const value = raw.trim();
  const german = value.match(/^(\d{1,2})[./](\d{1,2})[./](\d{2,4})$/);
  if (german) {
    const [, day, month, rawYear] = german;
    const year = rawYear.length === 2 ? `20${rawYear}` : rawYear;
    return toIso(year, month, day);
  }
  const iso = value.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    return toIso(iso[1], iso[2], iso[3]);
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return undefined;
  }
  return parsed.toISOString().slice(0, 10);
}

function toIso(year: string, month: string, day: string): string | undefined {
  const y = Number(year);
  const m = Number(month);
  const d = Number(day);
  if (m < 1 || m > 12 || d < 1 || d > 31) {
    return undefined;
  }
  return `${String(y).padStart(4, '0')}-${String(m).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

function looksDelimited(content: string): boolean {
  const firstLines = content.split(/\r?\n/).slice(0, 3).join('\n');
  return firstLines.includes(';') || firstLines.includes(',') || firstLines.includes('\t');
}

/**
 * Parse a delimited export (provider CSV, Lastgang export, Excel-saved CSV).
 * Header names are matched heuristically; without headers the first column is
 * treated as date and the second as value.
 */
export function extractFromDelimited(content: string, unitHint?: string): ExtractedDocument {
  const rows = parseCsv(content);
  if (rows.length === 0) {
    return { readings: [], notes: 'Delimited file contained no rows' };
  }
  const headers = Object.keys(rows[0]);
  const dateKey = findKey(headers, DATE_KEYS);
  const valueKey = findKey(headers, VALUE_KEYS);
  const unitKey = findKey(headers, UNIT_KEYS);

  const readings: ExtractedReading[] = [];
  for (const row of rows.slice(0, MAX_READINGS)) {
    const date = dateKey
      ? parseFlexibleDate(row[dateKey])
      : parseFlexibleDate(Object.values(row)[0]);
    const value = valueKey
      ? parseFlexibleNumber(row[valueKey])
      : parseFlexibleNumber(Object.values(row)[1]);
    if (!date || value === undefined) {
      continue;
    }
    readings.push({
      date,
      value,
      unit: (unitKey ? row[unitKey] : undefined) ?? unitHint,
      confidence: dateKey && valueKey ? 0.9 : 0.5,
    });
  }
  return {
    readings,
    notes: dateKey && valueKey
      ? undefined
      : 'No recognised date/value headers; parsed positionally',
  };
}

const READING_PATTERN = /(\d{1,2}[./]\d{1,2}[./]\d{2,4})[^\d\n]{0,80}?(\d{1,3}(?:[.\s]\d{3})*(?:,\d+)?|\d+)\s*(kWh|kwh|m³|m3)/g;
const AMOUNT_PATTERN = /(gesamtbetrag|rechnungsbetrag|zahlbetrag|abschlagsbetrag)[^\d\n]{0,40}([\d.]+,\d{2}|\d+)\s*(?:€|EUR)/i;

/** Best-effort extraction from a plain-text bill body. */
export function extractFromText(text: string, unitHint?: string): ExtractedDocument {
  const readings: ExtractedReading[] = [];
  const seen = new Set<string>();
  for (const match of text.matchAll(READING_PATTERN)) {
    const date = parseFlexibleDate(match[1]);
    const value = parseFlexibleNumber(match[2]);
    if (!date || value === undefined || seen.has(date)) {
      continue;
    }
    seen.add(date);
    readings.push({ date, value, unit: match[3] ?? unitHint, confidence: 0.4 });
  }

  const amountMatch = text.match(AMOUNT_PATTERN);
  const amountGross = amountMatch ? parseFlexibleNumber(amountMatch[2]) : undefined;

  return {
    readings,
    bill: amountGross === undefined
      ? undefined
      : { amountGross, currency: 'EUR' },
    notes: readings.length === 0 ? 'No meter readings recognised in the message body' : undefined,
  };
}

export function parseGeminiJson(raw: string): ExtractedDocument {
  const start = raw.indexOf('{');
  const end = raw.lastIndexOf('}');
  if (start === -1 || end === -1) {
    throw new Error('Extraction response contained no JSON object');
  }
  const parsed = JSON.parse(raw.slice(start, end + 1)) as {
    providerName?: string | null;
    meterNumber?: string | null;
    readings?: { date?: string | null; value?: number | string | null; unit?: string | null }[];
    bill?: {
      periodStart?: string | null;
      periodEnd?: string | null;
      consumption?: number | string | null;
      unit?: string | null;
      amountGross?: number | string | null;
      amountNet?: number | string | null;
      currency?: string | null;
    } | null;
  };

  const readings: ExtractedReading[] = [];
  for (const reading of parsed.readings ?? []) {
    const date = parseFlexibleDate(reading.date ?? undefined);
    const value = parseFlexibleNumber(reading.value ?? undefined);
    if (!date || value === undefined) {
      continue;
    }
    readings.push({ date, value, unit: reading.unit ?? undefined, confidence: 0.85 });
  }

  const bill = parsed.bill;
  return {
    providerName: parsed.providerName ?? undefined,
    meterNumber: parsed.meterNumber ?? undefined,
    readings,
    bill: bill
      ? {
          periodStart: parseFlexibleDate(bill.periodStart ?? undefined),
          periodEnd: parseFlexibleDate(bill.periodEnd ?? undefined),
          consumption: parseFlexibleNumber(bill.consumption ?? undefined),
          unit: bill.unit ?? undefined,
          amountGross: parseFlexibleNumber(bill.amountGross ?? undefined),
          amountNet: parseFlexibleNumber(bill.amountNet ?? undefined),
          currency: bill.currency ?? undefined,
        }
      : undefined,
  };
}

export interface ExtractDocumentArgs {
  mimeType: string;
  buffer: Buffer;
  textBody?: string;
  unitHint?: string;
  apiKey?: string;
}

export async function extractDocument(args: ExtractDocumentArgs): Promise<ExtractedDocument> {
  if (args.mimeType === 'application/pdf') {
    if (!args.apiKey) {
      throw new Error('PDF extraction needs a Gemini API key (Profile → Google API key)');
    }
    const raw = await extractPdfText(args.buffer, args.apiKey);
    return parseGeminiJson(raw);
  }

  if (args.mimeType === 'application/xml' || args.mimeType === 'text/xml') {
    throw new Error('XML exports are not supported yet');
  }

  if (args.mimeType === 'application/vnd.ms-excel') {
    throw new Error('Legacy .xls files are not supported; export as CSV');
  }

  const content = args.buffer.toString('utf8');
  if (args.mimeType === 'text/html') {
    const text = args.textBody?.trim() ? args.textBody : stripHtml(content);
    return extractFromText(text, args.unitHint);
  }
  if (looksDelimited(content)) {
    const delimited = extractFromDelimited(content, args.unitHint);
    if (delimited.readings.length > 0) {
      return delimited;
    }
  }
  const fromBody = args.textBody?.trim() ? args.textBody : content;
  return extractFromText(fromBody, args.unitHint);
}

export function stripHtml(html: string): string {
  return html
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
