export function downloadJson(data: unknown, filename: string): void {
  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  downloadAsFile(blob, filename);
}

export function downloadAsFile(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

export async function downloadFromUrl(url: string, filename: string): Promise<void> {
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error('Download failed');
    }

    const blob = await response.blob();
    downloadAsFile(blob, filename);
  } catch (error) {
    console.error('Download error:', error);
    throw error;
  }
}
