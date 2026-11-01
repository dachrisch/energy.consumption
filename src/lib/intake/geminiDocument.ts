const GEMINI_MODEL = 'gemini-2.5-flash';

const DOCUMENT_PROMPT = `You extract structured data from an energy provider document (bill, statement, meter reading notice).
Return ONLY minified JSON matching this shape, no prose and no markdown fences:
{
  "providerName": string|null,
  "meterNumber": string|null,
  "readings": [{ "date": "YYYY-MM-DD", "value": number, "unit": string|null }],
  "bill": {
    "periodStart": "YYYY-MM-DD"|null,
    "periodEnd": "YYYY-MM-DD"|null,
    "consumption": number|null,
    "unit": string|null,
    "amountGross": number|null,
    "amountNet": number|null,
    "currency": string|null
  }|null
}
Rules:
- "readings" are cumulative meter register values (Zählerstand), not consumption deltas.
- Dates must be ISO (YYYY-MM-DD). German documents use DD.MM.YYYY.
- Numbers use "." as decimal separator, no thousands separators.
- Use null when a field is absent. Never invent values.
- If the document is not an energy document, return {"readings": [], "bill": null}.`;

async function handleErrorResponse(response: Response): Promise<never> {
  let errorMsg = response.statusText;
  try {
    const errorJson = await response.json();
    if (errorJson?.error?.message) {
      errorMsg = errorJson.error.message;
    }
  } catch {
    // ignore body parse failures
  }
  throw new Error(`Gemini document extraction failed (${response.status}): ${errorMsg}`);
}

/**
 * Send a PDF to Gemini and get the structured extraction prompt back as text.
 * The caller parses and validates the JSON; this function only talks HTTP.
 */
export async function extractPdfText(buffer: Buffer, apiKey: string): Promise<string> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;
  const payload = {
    contents: [{
      parts: [
        { text: DOCUMENT_PROMPT },
        { inline_data: { mime_type: 'application/pdf', data: buffer.toString('base64') } },
      ],
    }],
    generationConfig: { temperature: 0, responseMimeType: 'application/json' },
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-goog-api-key': apiKey },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    await handleErrorResponse(response);
  }

  const data = await response.json() as {
    candidates?: { content?: { parts?: { text?: string }[] } }[];
  };
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!text) {
    throw new Error('Gemini returned an empty response');
  }
  return text;
}
