export async function performOcr(file: File): Promise<string> {
  // Convert File to Base64
  const reader = new FileReader();
  const base64 = await new Promise<string>((resolve, reject) => {
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = (_e) => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
  });

  const res = await fetch('/api/ocr/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ image: base64 })
  });

  if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'OCR failed');
  }

  const result = await res.json();
  return result.text;
}
