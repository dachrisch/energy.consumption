export async function scanImage(image: Blob, token: string): Promise<string> {
  const response = await fetch(
    'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': image.type || 'application/octet-stream',
      },
      body: image,
    }
  );

  if (!response.ok) {
    throw new Error(`OCR failed: ${response.statusText}`);
  }

  const result = await response.json();
  // HF Vision-to-text usually returns [{ generated_text: "..." }]
  return result[0]?.generated_text || '';
}