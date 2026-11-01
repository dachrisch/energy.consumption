import { describe, it, expect } from 'vitest';
import {
  MAX_ATTACHMENT_BYTES,
  SUPPORTED_MIME_TYPES,
  buildProviderQuery,
  collectAttachments,
  collectTextBody,
  decodeBase64Url,
  headerValue,
  isSupported,
  resolveMimeType,
} from '../gmail';
import type { GmailPayload } from '../gmail';

function encode(value: string): string {
  return Buffer.from(value, 'utf8').toString('base64');
}

const payload: GmailPayload = {
  mimeType: 'multipart/mixed',
  headers: [
    { name: 'From', value: 'Stadtwerke <rechnung@stadtwerke.example>' },
    { name: 'Subject', value: 'Ihre Jahresabrechnung' },
  ],
  parts: [
    {
      mimeType: 'multipart/alternative',
      parts: [
        { mimeType: 'text/plain', filename: null, body: { data: encode('Ihr Zählerstand: 1000 kWh') } },
        { mimeType: 'text/html', filename: null, body: { data: encode('<p>Ihr Zählerstand: 1000 kWh</p>') } },
      ],
    },
    {
      mimeType: 'application/pdf',
      filename: 'Rechnung.pdf',
      body: { attachmentId: 'att-1', size: 1234 },
    },
    {
      mimeType: 'text/csv',
      filename: 'lastgang.csv',
      body: { attachmentId: 'att-2', size: 99 },
    },
    {
      mimeType: 'image/png',
      filename: 'logo.png',
      body: { data: encode('inline-bytes'), attachmentId: 'att-3' },
    },
    {
      // Inline parts without a filename are not documents.
      mimeType: 'image/png',
      filename: '',
      body: { attachmentId: 'att-4' },
    },
  ],
};

describe('buildProviderQuery', () => {
  it('searches by sender, recent mail and attachments', () => {
    const query = buildProviderQuery({ senders: ['a@example.com'], subjectHints: [] });

    expect(query).toBe('from:a@example.com newer_than:120d has:attachment');
  });

  it('groups multiple senders into one OR clause', () => {
    const query = buildProviderQuery({
      senders: ['a@example.com', 'b@example.com'],
      subjectHints: [],
    });

    expect(query).toContain('from:(a@example.com OR b@example.com)');
  });

  it('only falls back to subject hints when no sender is configured', () => {
    const withSenders = buildProviderQuery({
      senders: ['a@example.com'],
      subjectHints: ['Rechnung'],
    });
    const withoutSenders = buildProviderQuery({ senders: [], subjectHints: ['Rechnung', 'Abrechnung'] });

    expect(withSenders).not.toContain('subject:');
    expect(withoutSenders).toContain('subject:(Rechnung OR Abrechnung)');
  });

  it('ignores blank entries and honours the lookback window', () => {
    const query = buildProviderQuery({ senders: ['  ', 'a@example.com'], subjectHints: [] }, 30);
    expect(query).toBe('from:a@example.com newer_than:30d has:attachment');
  });

  it('lets an explicit query win over the generated one', () => {
    expect(buildProviderQuery({
      senders: ['a@example.com'],
      subjectHints: [],
      gmailQuery: ' from:custom@example.com ',
    })).toBe('from:custom@example.com');
  });

  it('still constrains bare queries to attachments', () => {
    expect(buildProviderQuery({ senders: [], subjectHints: [] }))
      .toBe('newer_than:120d has:attachment');
  });
});

describe('decodeBase64Url', () => {
  it('decodes url-safe alphabet to utf8 text', () => {
    const value = Buffer.from('Zähler >>>', 'utf8').toString('base64url');
    expect(decodeBase64Url(value).toString('utf8')).toBe('Zähler >>>');
  });
});

describe('collectAttachments', () => {
  it('walks nested parts and keeps the document metadata', () => {
    expect(collectAttachments(payload)).toEqual([
      {
        fileName: 'Rechnung.pdf',
        mimeType: 'application/pdf',
        attachmentId: 'att-1',
        inlineData: undefined,
        size: 1234,
      },
      {
        fileName: 'lastgang.csv',
        mimeType: 'text/csv',
        attachmentId: 'att-2',
        inlineData: undefined,
        size: 99,
      },
      {
        fileName: 'logo.png',
        mimeType: 'image/png',
        attachmentId: 'att-3',
        inlineData: encode('inline-bytes'),
        size: undefined,
      },
    ]);
  });

  it('returns nothing for empty payloads and defaults the mime type', () => {
    expect(collectAttachments(null)).toEqual([]);
    expect(collectAttachments(undefined)).toEqual([]);
    expect(collectAttachments({ parts: [{ filename: 'x.bin' }] })).toEqual([
      {
        fileName: 'x.bin',
        mimeType: 'application/octet-stream',
        attachmentId: undefined,
        inlineData: undefined,
        size: undefined,
      },
    ]);
  });
});

describe('collectTextBody', () => {
  it('joins the plain text parts and ignores html and attachments', () => {
    expect(collectTextBody(payload)).toBe('Ihr Zählerstand: 1000 kWh');
  });

  it('returns an empty string without a text body', () => {
    expect(collectTextBody(null)).toBe('');
    expect(collectTextBody({ parts: [{ mimeType: 'text/html', body: { data: encode('x') } }] })).toBe('');
  });
});

describe('headerValue', () => {
  it('looks headers up case-insensitively', () => {
    expect(headerValue(payload, 'from')).toContain('stadtwerke.example');
    expect(headerValue(payload, 'SUBJECT')).toBe('Ihre Jahresabrechnung');
  });

  it('returns an empty string when the header is missing', () => {
    expect(headerValue(payload, 'Date')).toBe('');
    expect(headerValue(null, 'From')).toBe('');
  });
});

describe('attachment support', () => {
  it('knows which formats the extractor understands', () => {
    expect(isSupported('application/pdf')).toBe(true);
    expect(isSupported('text/csv')).toBe(true);
    expect(isSupported('image/png')).toBe(false);
    expect(SUPPORTED_MIME_TYPES).not.toContain('application/zip');
  });

  it('reads a PDF sent as a generic binary by its .pdf name', () => {
    expect(resolveMimeType('application/octet-stream', 'Rechnung_433876866.pdf')).toBe('application/pdf');
    expect(resolveMimeType('application/octet-stream', 'BILL.PDF')).toBe('application/pdf');
  });

  it('recognises a PDF by its %PDF signature when the name gives no hint', () => {
    expect(resolveMimeType('application/octet-stream', 'download', Buffer.from('%PDF-1.7 ...'))).toBe('application/pdf');
    expect(resolveMimeType('', 'download', Buffer.from('%PDF-1.4'))).toBe('application/pdf');
  });

  it('maps other known extensions behind a generic type', () => {
    expect(resolveMimeType('application/octet-stream', 'lastgang.csv')).toBe('text/csv');
    expect(resolveMimeType('application/octet-stream', 'export.xml')).toBe('application/xml');
    expect(resolveMimeType('application/octet-stream', 'werte.xls')).toBe('application/vnd.ms-excel');
  });

  it('keeps a specific declared type and leaves unknown binaries alone', () => {
    expect(resolveMimeType('application/pdf', 'odd-name.csv')).toBe('application/pdf');
    expect(resolveMimeType('image/png', 'scan.pdf')).toBe('image/png');
    expect(resolveMimeType('application/octet-stream', 'photo.jpg', Buffer.from([0xff, 0xd8, 0xff])))
      .toBe('application/octet-stream');
  });

  it('caps downloads at 15 MiB', () => {
    expect(MAX_ATTACHMENT_BYTES).toBe(15 * 1024 * 1024);
  });
});
