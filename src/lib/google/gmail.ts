import { google } from 'googleapis';
import type { OAuth2Client } from 'google-auth-library';

export interface GmailPart {
  mimeType?: string | null;
  filename?: string | null;
  body?: { attachmentId?: string | null; data?: string | null; size?: number | null } | null;
  parts?: GmailPart[] | null;
}

export interface GmailPayload extends GmailPart {
  headers?: { name?: string | null; value?: string | null }[] | null;
}

export interface GmailMessage {
  id?: string | null;
  internalDate?: string | null;
  payload?: GmailPayload | null;
}

/** Minimal subset of the Gmail v1 client (injectable for tests). */
export interface GmailClientLike {
  users: {
    messages: {
      list(params: {
        userId: string;
        q?: string;
        maxResults?: number;
      }): Promise<{ data: { messages?: { id?: string | null }[] | null } }>;
      get(params: {
        userId: string;
        id: string;
        format?: string;
      }): Promise<{ data: GmailMessage }>;
      // googleapis nests this under messages: users.messages.attachments.get
      attachments: {
        get(params: {
          userId: string;
          messageId: string;
          id: string;
        }): Promise<{ data: { data?: string | null; size?: number | null } }>;
      };
    };
  };
}

/** Documents we know how to extract from. Everything else is recorded as failed. */
export const SUPPORTED_MIME_TYPES = [
  'application/pdf',
  'text/csv',
  'text/plain',
  'text/html',
  'application/xml',
  'text/xml',
  'application/vnd.ms-excel',
] as const;

export const MAX_ATTACHMENT_BYTES = 15 * 1024 * 1024;

export function gmailFor(auth: OAuth2Client): GmailClientLike {
  return google.gmail({ version: 'v1', auth }) as unknown as GmailClientLike;
}

export interface ProviderQueryInput {
  senders: string[];
  subjectHints: string[];
  gmailQuery?: string | null;
}

/**
 * Gmail search for one provider. Sender addresses are the reliable signal;
 * subject hints are added as an OR group only when no sender is configured,
 * because "from X and subject Y" misses bills with unusual subjects.
 */
export function buildProviderQuery(provider: ProviderQueryInput, sinceDays = 120): string {
  const custom = provider.gmailQuery?.trim();
  if (custom) {
    return custom;
  }
  const senders = provider.senders.map((s) => s.trim()).filter(Boolean);
  const hints = provider.subjectHints.map((s) => s.trim()).filter(Boolean);
  const parts: string[] = [];
  if (senders.length === 1) {
    parts.push(`from:${senders[0]}`);
  } else if (senders.length > 1) {
    parts.push(`from:(${senders.join(' OR ')})`);
  }
  if (senders.length === 0 && hints.length > 0) {
    parts.push(`subject:(${hints.join(' OR ')})`);
  }
  parts.push(`newer_than:${sinceDays}d`);
  parts.push('has:attachment');
  return parts.join(' ');
}

export function decodeBase64Url(value: string): Buffer {
  return Buffer.from(value.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
}

export interface AttachmentRef {
  fileName: string;
  mimeType: string;
  attachmentId?: string;
  inlineData?: string;
  size?: number;
}

function walk(part: GmailPart | null | undefined, visit: (p: GmailPart) => void): void {
  if (!part) {
    return;
  }
  visit(part);
  for (const child of part.parts ?? []) {
    walk(child, visit);
  }
}

export function collectAttachments(payload: GmailPayload | null | undefined): AttachmentRef[] {
  const out: AttachmentRef[] = [];
  walk(payload, (part) => {
    const fileName = part.filename?.trim();
    if (!fileName) {
      return;
    }
    out.push({
      fileName,
      mimeType: part.mimeType ?? 'application/octet-stream',
      attachmentId: part.body?.attachmentId ?? undefined,
      inlineData: part.body?.data ?? undefined,
      size: part.body?.size ?? undefined,
    });
  });
  return out;
}

export function collectTextBody(payload: GmailPayload | null | undefined): string {
  const texts: string[] = [];
  walk(payload, (part) => {
    if (part.mimeType !== 'text/plain' || part.filename) {
      return;
    }
    const data = part.body?.data;
    if (data) {
      texts.push(decodeBase64Url(data).toString('utf8'));
    }
  });
  return texts.join('\n').trim();
}

export function headerValue(payload: GmailPayload | null | undefined, name: string): string {
  const lower = name.toLowerCase();
  const header = (payload?.headers ?? []).find((h) => (h.name ?? '').toLowerCase() === lower);
  return header?.value ?? '';
}

export function isSupported(mimeType: string): boolean {
  return (SUPPORTED_MIME_TYPES as readonly string[]).includes(mimeType);
}

/** Labels mail clients use when they don't know (or don't say) what a file is. */
const GENERIC_MIME_TYPES = new Set([
  '',
  'application/octet-stream',
  'binary/octet-stream',
  'application/x-download',
  'application/download',
  'application/force-download',
]);

const MIME_BY_EXTENSION: Record<string, string> = {
  pdf: 'application/pdf',
  csv: 'text/csv',
  txt: 'text/plain',
  html: 'text/html',
  htm: 'text/html',
  xml: 'application/xml',
  xls: 'application/vnd.ms-excel',
};

const PDF_SIGNATURE = Buffer.from('%PDF-');

/**
 * Some providers (e.g. SWM) attach bills as `application/octet-stream`. When the
 * declared type is generic, infer the real one from the file's signature or its
 * extension. A specific declared type is always kept.
 */
export function resolveMimeType(declared: string | null | undefined, fileName: string, content?: Buffer): string {
  const type = (declared ?? '').trim().toLowerCase();
  if (!GENERIC_MIME_TYPES.has(type)) {
    return type;
  }
  if (content && content.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE)) {
    return 'application/pdf';
  }
  const extension = fileName.toLowerCase().split('.').pop() ?? '';
  return MIME_BY_EXTENSION[extension] ?? (type || 'application/octet-stream');
}
