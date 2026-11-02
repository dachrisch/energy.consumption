import { createRequire } from 'node:module';
import path from 'node:path';
import { describe, it, expect } from 'vitest';

const requireScript = createRequire(path.resolve(process.cwd(), 'scripts/__tests__/index.cjs'));
const { appNameKey, matchKey, parseArgs, union } = requireScript('../migrate-suppliers.cjs') as {
  appNameKey: (name: string) => string;
  matchKey: (name: string) => string;
  union: (values: string[]) => string[];
  parseArgs: (argv: string[]) => { dryRun: boolean; help: boolean; maps: Map<string, string> };
};

describe('migrate-suppliers helpers', () => {
  it('normalizes case, accents, punctuation and whitespace for matching', () => {
    expect(matchKey(' Octo-Énergie ')).toBe('octo energie');
    expect(matchKey('Octo Energie')).toBe('octo energie');
    expect(matchKey('Müller & Söhne')).toBe('muller and sohne');
  });

  it('keeps the stricter key the app stores on Supplier.nameKey', () => {
    expect(appNameKey('  Octo   Energie ')).toBe('octo energie');
    expect(appNameKey('Octo-Energie')).toBe('octo-energie');
  });

  it('parses --dry-run and repeatable --map flags', () => {
    const options = parseArgs(['--dry-run', '--map', 'Octopus Energy=Octo', '--map=Stadt Werke=Stadtwerke']);

    expect(options.dryRun).toBe(true);
    expect(options.maps.get(matchKey('Octopus Energy'))).toBe('Octo');
    expect(options.maps.get(matchKey('Stadt Werke'))).toBe('Stadtwerke');
  });

  it('rejects malformed flags', () => {
    expect(() => parseArgs(['--nope'])).toThrow(/Unknown argument/);
    expect(() => parseArgs(['--map', 'only-a-name'])).toThrow(/--map expects/);
  });

  it('unions settings case-insensitively without duplicates', () => {
    expect(union(['b@example.com', 'A@example.com', 'a@example.com', ' ']))
      .toEqual(['A@example.com', 'b@example.com']);
  });
});
