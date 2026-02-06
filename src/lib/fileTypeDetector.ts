export function detectFileType(filename: string, content?: string): 'json' | 'csv' {
  // Check file extension first
  if (filename.endsWith('.json')) {
    return 'json';
  }
  if (filename.endsWith('.csv')) {
    return 'csv';
  }

  // Try to detect from content
  if (content) {
    const trimmed = content.trim();
    if (trimmed.startsWith('[') || trimmed.startsWith('{')) {
      return 'json';
    }
  }

  // Default to CSV
  return 'csv';
}
