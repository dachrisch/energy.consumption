import { describe, it, expect, vi, beforeEach } from 'vitest';
import { scanImage } from '../ocrBackend';

global.fetch = vi.fn();

describe('OCR Backend Service', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  it('calls Hugging Face API with correct headers and body', async () => {
    const mockImage = new Blob(['image data'], { type: 'image/jpeg' });
    const token = 'hf_test_token';
    
    (fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ([{ generated_text: '12345' }])
    });

    const result = await scanImage(mockImage, token);

    expect(fetch).toHaveBeenCalledWith(
      'https://api-inference.huggingface.co/models/microsoft/trocr-base-printed',
      expect.objectContaining({
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'image/jpeg'
        },
        body: mockImage
      })
    );
    expect(result).toBe('12345');
  });

  it('handles API errors gracefully', async () => {
    const mockImage = new Blob(['']);
    (fetch as any).mockResolvedValue({
      ok: false,
      statusText: 'Service Unavailable'
    });

    await expect(scanImage(mockImage, 'token')).rejects.toThrow('OCR failed: Service Unavailable');
  });
});
