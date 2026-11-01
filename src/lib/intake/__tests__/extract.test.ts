import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  MAX_READINGS,
  extractDocument,
  extractFromDelimited,
  extractFromText,
  parseFlexibleDate,
  parseFlexibleNumber,
  parseGeminiJson,
  stripHtml,
} from '../extract';

describe('parseFlexibleNumber', () => {
  it('accepts numbers and numeric strings', () => {
    expect(parseFlexibleNumber(42)).toBe(42);
    expect(parseFlexibleNumber('42')).toBe(42);
    expect(parseFlexibleNumber(' 3.5 ')).toBe(3.5);
  });

  it('parses German thousands separators and decimal commas', () => {
    expect(parseFlexibleNumber('3.877,3')).toBe(3877.3);
    expect(parseFlexibleNumber('1.234.567')).toBe(1234567);
    expect(parseFlexibleNumber('3877,25')).toBe(3877.25);
  });

  it('strips currency symbols and units', () => {
    expect(parseFlexibleNumber('1.234,56 €')).toBe(1234.56);
    expect(parseFlexibleNumber('850 kWh')).toBe(850);
  });

  it('returns undefined for missing or non-numeric input', () => {
    expect(parseFlexibleNumber(undefined)).toBeUndefined();
    expect(parseFlexibleNumber(null)).toBeUndefined();
    expect(parseFlexibleNumber('')).toBeUndefined();
    expect(parseFlexibleNumber('keine Angabe')).toBeUndefined();
    expect(parseFlexibleNumber(Number.NaN)).toBeUndefined();
  });
});

describe('parseFlexibleDate', () => {
  it('parses German dates', () => {
    expect(parseFlexibleDate('01.02.2024')).toBe('2024-02-01');
    expect(parseFlexibleDate('1.2.24')).toBe('2024-02-01');
    expect(parseFlexibleDate('31/12/2023')).toBe('2023-12-31');
  });

  it('parses ISO dates and timestamps', () => {
    expect(parseFlexibleDate('2024-02-29')).toBe('2024-02-29');
    expect(parseFlexibleDate('2024-03-01T10:00:00Z')).toBe('2024-03-01');
  });

  it('rejects impossible dates and empty input', () => {
    expect(parseFlexibleDate('32.13.2024')).toBeUndefined();
    expect(parseFlexibleDate('')).toBeUndefined();
    expect(parseFlexibleDate(undefined)).toBeUndefined();
  });
});

describe('extractFromDelimited', () => {
  it('maps recognised date/value headers and keeps the unit', () => {
    const csv = `Datum;Zählerstand;Einheit
01.01.2024;1000,5;kWh
01.02.2024;1120,5;kWh`;

    const result = extractFromDelimited(csv);

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 1000.5, unit: 'kWh', confidence: 0.9 },
      { date: '2024-02-01', value: 1120.5, unit: 'kWh', confidence: 0.9 },
    ]);
    expect(result.notes).toBeUndefined();
  });

  it('falls back to positional parsing when headers are unknown', () => {
    const csv = `Spalte A;Spalte B
01.01.2024;100
01.02.2024;200`;

    const result = extractFromDelimited(csv, 'kWh');

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 100, unit: 'kWh', confidence: 0.5 },
      { date: '2024-02-01', value: 200, unit: 'kWh', confidence: 0.5 },
    ]);
    expect(result.notes).toContain('positionally');
  });

  it('skips rows it cannot understand and reports an empty file', () => {
    const result = extractFromDelimited('Datum;Wert\nkeine Zahl;x');
    expect(result.readings).toEqual([]);

    const empty = extractFromDelimited('   ');
    expect(empty.readings).toEqual([]);
    expect(empty.notes).toContain('no rows');
  });

  it('caps the number of parsed readings', () => {
    const rows = ['Datum;Wert'];
    for (let i = 0; i < MAX_READINGS + 5; i += 1) {
      rows.push(`01.01.2024;${1000 + i}`);
    }
    expect(extractFromDelimited(rows.join('\n')).readings).toHaveLength(MAX_READINGS);
  });
});

describe('extractFromText', () => {
  it('finds meter readings and the billed amount', () => {
    const body = [
      'Sehr geehrter Kunde,',
      'Ihr Zählerstand am 01.01.2024 betrug 1.234 kWh.',
      'Ihr Zählerstand am 31.03.2024 betrug 1.456 kWh.',
      'Rechnungsbetrag: 123,45 €',
    ].join('\n');

    const result = extractFromText(body);

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 1234, unit: 'kWh', confidence: 0.4 },
      { date: '2024-03-31', value: 1456, unit: 'kWh', confidence: 0.4 },
    ]);
    expect(result.bill).toEqual({ amountGross: 123.45, currency: 'EUR' });
    expect(result.notes).toBeUndefined();
  });

  it('reports when nothing was recognised', () => {
    const result = extractFromText('Ihre Rechnung ist im Anhang.');
    expect(result.readings).toEqual([]);
    expect(result.bill).toBeUndefined();
    expect(result.notes).toContain('No meter readings');
  });
});

describe('parseGeminiJson', () => {
  it('parses JSON wrapped in prose or fences', () => {
    const raw = 'Here you go:\n```json\n{"meterNumber":"1-234","readings":[{"date":"2024-01-01","value":"1000,5","unit":"kWh"}],"bill":null}\n```';

    const result = parseGeminiJson(raw);

    expect(result.meterNumber).toBe('1-234');
    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 1000.5, unit: 'kWh', confidence: 0.85 },
    ]);
    expect(result.bill).toBeUndefined();
  });

  it('normalises bill fields and drops unusable readings', () => {
    const raw = JSON.stringify({
      providerName: 'Stadtwerke',
      readings: [{ date: null, value: 5 }, { date: '01.02.2024', value: 5 }],
      bill: { periodStart: '01.01.2024', periodEnd: '31.03.2024', consumption: '250,5', amountGross: 99.9, currency: 'EUR' },
    });

    const result = parseGeminiJson(raw);

    expect(result.providerName).toBe('Stadtwerke');
    expect(result.readings).toHaveLength(1);
    expect(result.bill).toEqual({
      periodStart: '2024-01-01',
      periodEnd: '2024-03-31',
      consumption: 250.5,
      unit: undefined,
      amountGross: 99.9,
      amountNet: undefined,
      currency: 'EUR',
    });
  });

  it('throws when there is no JSON object', () => {
    expect(() => parseGeminiJson('no structured data')).toThrow(/no JSON object/);
  });
});

describe('stripHtml', () => {
  it('removes tags and collapses whitespace', () => {
    expect(stripHtml('<p>Hello   <b>world</b></p>')).toBe('Hello world');
  });

  it('drops script and style content', () => {
    const html = '<style>.a{color:red}</style><p>Wert 100</p><script>alert("x")</script>';
    expect(stripHtml(html)).toBe('Wert 100');
  });

  it('drops script content with unusual end tags and attributes', () => {
    const cases = [
      '<p>Wert 100</p><script>bad()</script >',
      '<p>Wert 100</p><SCRIPT type="text/javascript">bad()</SCRIPT\n>',
      '<p>Wert 100</p><script src="x.js"/>',
      '<p>Wert 100</p><script>bad()',
    ];

    for (const html of cases) {
      expect(stripHtml(html)).toBe('Wert 100');
    }
  });

  it('keeps text that merely contains an angle bracket', () => {
    expect(stripHtml('<p>Wert &lt; 100</p>')).toBe('Wert < 100');
    expect(stripHtml('Verbrauch < 100 kWh')).toBe('Verbrauch < 100 kWh');
  });

  it('decodes common entities', () => {
    expect(stripHtml('A&nbsp;B &amp; C &quot;D&quot; &#39;E&#39;')).toBe('A B & C "D" \'E\'');
  });

  it('does not treat a longer tag name as a script element', () => {
    expect(stripHtml('<p>Wert 100</p><scripts>keep</scripts>')).toBe('Wert 100 keep');
  });
});

describe('extractDocument', () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('uses the plain text body of an HTML mail when present', async () => {
    const result = await extractDocument({
      mimeType: 'text/html',
      buffer: Buffer.from('<p>Zählerstand 01.01.2024: 500 kWh</p>'),
      textBody: 'Zählerstand 01.01.2024: 500 kWh',
    });

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 500, unit: 'kWh', confidence: 0.4 },
    ]);
  });

  it('strips HTML when no text body was provided', async () => {
    const result = await extractDocument({
      mimeType: 'text/html',
      buffer: Buffer.from('<html><body><p>Zählerstand 01.01.2024: 500 kWh</p></body></html>'),
    });

    expect(result.readings).toHaveLength(1);
  });

  it('prefers a delimited parse for CSV attachments', async () => {
    const result = await extractDocument({
      mimeType: 'text/csv',
      buffer: Buffer.from('Datum;Wert\n01.01.2024;500'),
      unitHint: 'kWh',
    });

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 500, unit: 'kWh', confidence: 0.9 },
    ]);
  });

  it('rejects formats it cannot read yet', async () => {
    await expect(extractDocument({ mimeType: 'application/xml', buffer: Buffer.from('<x/>') }))
      .rejects.toThrow(/XML/);
    await expect(extractDocument({ mimeType: 'application/vnd.ms-excel', buffer: Buffer.from('x') }))
      .rejects.toThrow(/export as CSV/);
  });

  it('needs a Gemini key before sending a PDF', async () => {
    await expect(extractDocument({ mimeType: 'application/pdf', buffer: Buffer.from('%PDF') }))
      .rejects.toThrow(/Gemini API key/);
  });

  it('sends PDFs to Gemini and parses the JSON answer', async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        candidates: [{ content: { parts: [{ text: '{"readings":[{"date":"2024-01-01","value":500,"unit":"kWh"}]}' }] } }],
      }),
    });
    vi.stubGlobal('fetch', fetchMock);

    const result = await extractDocument({
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
      apiKey: 'test-key',
    });

    expect(result.readings).toEqual([
      { date: '2024-01-01', value: 500, unit: 'kWh', confidence: 0.85 },
    ]);
    const [url, init] = fetchMock.mock.calls[0] as [string, { headers: Record<string, string>; body: string }];
    expect(url).toContain('gemini-2.5-flash:generateContent');
    expect(init.headers['x-goog-api-key']).toBe('test-key');
    expect(JSON.parse(init.body).contents[0].parts[1].inline_data.mime_type).toBe('application/pdf');
  });

  it('surfaces Gemini errors with the API message', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
      status: 429,
      statusText: 'Too Many Requests',
      json: async () => ({ error: { message: 'Quota exceeded' } }),
    }));

    await expect(extractDocument({
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF'),
      apiKey: 'k',
    })).rejects.toThrow(/429.*Quota exceeded/);
  });
});
