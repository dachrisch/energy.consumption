export function parseCsv(content: string, options: { delimiter?: string } = {}): Record<string, string>[] {
  const lines = content.split(/\r?\n/).map(line => line.trim()).filter(line => line.length > 0);
  
  if (lines.length === 0) {
    return [];
  }

  // Auto-detect delimiter if not provided
  let delimiter = options.delimiter;
  if (!delimiter) {
    const firstLine = lines[0];
    if (firstLine.includes('\t')) {
      delimiter = '\t';
    } else if (firstLine.includes(';')) {
      delimiter = ';';
    } else {
      delimiter = ',';
    }
  }

  const splitLine = (line: string, delim: string): string[] => {
    // Regex explanation:
    // Match one of:
    // 1. A quoted string: "..." (capturing group 1)
    // 2. A non-quoted value: anything until the delimiter (capturing group 2)
    // Followed by the delimiter or end of string
    // NOTE: This simple regex has limitations but covers basic quoted vs unquoted
    // For robust parsing, we iterate.
    
    const result: string[] = [];
    let current = '';
    let inQuote = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        inQuote = !inQuote;
      } else if (char === delim && !inQuote) {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current);
    
    // Clean up quotes from values
    return result.map(val => {
        val = val.trim();
        if (val.startsWith('"') && val.endsWith('"')) {
            return val.slice(1, -1).replace(/""/g, '"'); // Unescape double quotes
        }
        return val;
    });
  };

  const headers = splitLine(lines[0], delimiter);
  
  const results: Record<string, string>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const currentLine = lines[i];
    const values = splitLine(currentLine, delimiter);
    
    const obj: Record<string, string> = {};
    headers.forEach((header, index) => {
      obj[header] = values[index] ?? '';
    });
    results.push(obj);
  }

  return results;
}
