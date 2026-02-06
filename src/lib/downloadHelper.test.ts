import { describe, it, expect, vi, beforeEach } from 'vitest';
import { downloadJson, downloadAsFile, downloadFromUrl } from './downloadHelper';

describe('downloadHelper', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('downloadJson', () => {
    it('should create a JSON blob and initiate download', () => {
      const linkMock = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(linkMock as any);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(linkMock as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const testData = { id: 1, name: 'Test' };
      const filename = 'test.json';

      downloadJson(testData, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalled();
      expect(linkMock.download).toBe(filename);
      expect(appendSpy).toHaveBeenCalled();
      expect(linkMock.click).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should stringify data with 2-space indentation', () => {
      const linkMock = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      
      vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'appendChild').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'removeChild').mockReturnValue(linkMock as any);
      vi.spyOn(URL, 'revokeObjectURL');

      const testData = { id: 1, name: 'Test' };
      downloadJson(testData, 'test.json');

      // The data passed to createObjectURL should be a Blob created from stringified data
      const blobArg = createObjectURLSpy.mock.calls[0]?.[0];
      expect(blobArg).toBeInstanceOf(Blob);

      createObjectURLSpy.mockRestore();
    });
  });

  describe('downloadAsFile', () => {
    it('should create a download link and trigger click', () => {
      const linkMock = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      const createElementSpy = vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      const appendSpy = vi.spyOn(document.body, 'appendChild').mockReturnValue(linkMock as any);
      const removeSpy = vi.spyOn(document.body, 'removeChild').mockReturnValue(linkMock as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      const revokeObjectURLSpy = vi.spyOn(URL, 'revokeObjectURL');

      const blob = new Blob(['test'], { type: 'text/plain' });
      const filename = 'test.txt';

      downloadAsFile(blob, filename);

      expect(createElementSpy).toHaveBeenCalledWith('a');
      expect(createObjectURLSpy).toHaveBeenCalledWith(blob);
      expect(linkMock.download).toBe(filename);
      expect(appendSpy).toHaveBeenCalled();
      expect(linkMock.click).toHaveBeenCalled();
      expect(removeSpy).toHaveBeenCalled();
      expect(revokeObjectURLSpy).toHaveBeenCalledWith('blob:mock-url');

      createElementSpy.mockRestore();
      appendSpy.mockRestore();
      removeSpy.mockRestore();
      createObjectURLSpy.mockRestore();
      revokeObjectURLSpy.mockRestore();
    });

    it('should set the correct href on the link element', () => {
      const linkMock = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'appendChild').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'removeChild').mockReturnValue(linkMock as any);
      const createObjectURLSpy = vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:test-123');
      vi.spyOn(URL, 'revokeObjectURL');

      const blob = new Blob(['test'], { type: 'text/plain' });
      downloadAsFile(blob, 'file.txt');

      expect(linkMock.href).toBe('blob:test-123');

      createObjectURLSpy.mockRestore();
    });
  });

  describe('downloadFromUrl', () => {
    it('should fetch from URL and download the blob', async () => {
      const linkMock = {
        href: '',
        download: '',
        click: vi.fn(),
      };

      vi.spyOn(document, 'createElement').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'appendChild').mockReturnValue(linkMock as any);
      vi.spyOn(document.body, 'removeChild').mockReturnValue(linkMock as any);
      vi.spyOn(URL, 'createObjectURL').mockReturnValue('blob:mock-url');
      vi.spyOn(URL, 'revokeObjectURL');

      const mockBlob = new Blob(['test content'], { type: 'application/json' });
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(mockBlob),
      } as any);

      await downloadFromUrl('/api/export/test', 'export.json');

      expect(fetchSpy).toHaveBeenCalledWith('/api/export/test');
      expect(linkMock.click).toHaveBeenCalled();

      fetchSpy.mockRestore();
    });

    it('should throw error when fetch returns not ok', async () => {
      const fetchSpy = vi.spyOn(global, 'fetch').mockResolvedValue({
        ok: false,
      } as any);

      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(downloadFromUrl('/api/export/test', 'export.json')).rejects.toThrow('Download failed');

      expect(fetchSpy).toHaveBeenCalledWith('/api/export/test');
      expect(consoleErrorSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });

    it('should throw error when network request fails', async () => {
      const fetchError = new Error('Network error');
      const fetchSpy = vi.spyOn(global, 'fetch').mockRejectedValue(fetchError);
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

      await expect(downloadFromUrl('/api/export/test', 'export.json')).rejects.toThrow('Network error');

      expect(consoleErrorSpy).toHaveBeenCalled();

      fetchSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });
});
