import { google } from 'googleapis';
import { Readable } from 'node:stream';
import type { OAuth2Client } from 'google-auth-library';

export interface DriveFileRef {
  id?: string | null;
  name?: string | null;
  webViewLink?: string | null;
}

/** Minimal subset of the Drive v3 client used here (injectable for tests). */
export interface DriveClientLike {
  files: {
    list(params: {
      q: string;
      fields?: string;
      spaces?: string;
      pageSize?: number;
    }): Promise<{ data: { files?: DriveFileRef[] | null } }>;
    create(params: {
      requestBody: { name: string; parents?: string[]; mimeType?: string };
      media: { mimeType: string; body: Buffer | string | Readable };
      fields?: string;
    }): Promise<{ data: { id?: string | null; webViewLink?: string | null } }>;
    get(
      params: { fileId: string; alt: 'media' },
      options: { responseType: 'arraybuffer' },
    ): Promise<{ data: unknown }>;
  };
}

export const FOLDER_MIME = 'application/vnd.google-apps.folder';

export function driveFor(auth: OAuth2Client): DriveClientLike {
  return google.drive({ version: 'v3', auth }) as unknown as DriveClientLike;
}

export function escapeDriveQuery(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

/**
 * Find a folder by name under a parent, creating it when missing. Only folders
 * created by this app are visible under `drive.file`, which is exactly the
 * subtree we manage.
 */
export async function ensureFolder(
  drive: DriveClientLike,
  name: string,
  parentId?: string,
): Promise<string> {
  const parentClause = parentId ? `'${escapeDriveQuery(parentId)}' in parents and ` : '';
  const existing = await drive.files.list({
    q: `${parentClause}name = '${escapeDriveQuery(name)}' and mimeType = '${FOLDER_MIME}' and trashed = false`,
    fields: 'files(id, name)',
    spaces: 'drive',
    pageSize: 10,
  });
  const found = existing.data.files?.[0]?.id;
  if (found) {
    return found;
  }
  const created = await drive.files.create({
    requestBody: {
      name,
      mimeType: FOLDER_MIME,
      ...(parentId ? { parents: [parentId] } : {}),
    },
    media: { mimeType: FOLDER_MIME, body: '' },
    fields: 'id',
  });
  const id = created.data.id;
  if (!id) {
    throw new Error(`Drive did not return an id for folder ${name}`);
  }
  return id;
}

export async function uploadFile(
  drive: DriveClientLike,
  args: { name: string; mimeType: string; body: Buffer | string; parentId: string },
): Promise<{ id: string; webViewLink: string }> {
  const res = await drive.files.create({
    requestBody: { name: args.name, parents: [args.parentId] },
    media: {
      mimeType: args.mimeType,
      // googleapis pipes the media body for multipart uploads, so a Buffer must
      // be a Readable — a plain Buffer fails with "part.body.pipe is not a function".
      body: typeof args.body === 'string' ? args.body : Readable.from([args.body]),
    },
    fields: 'id, webViewLink',
  });
  const id = res.data.id;
  if (!id) {
    throw new Error(`Drive did not return an id for ${args.name}`);
  }
  return { id, webViewLink: res.data.webViewLink ?? '' };
}

export interface ArchiveArgs {
  rootFolderId: string;
  providerName: string;
  year: number;
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  extracted: unknown;
}

export interface ArchiveResult {
  fileId: string;
  webLink: string;
  sidecarId: string;
}

/**
 * File the original document plus a JSON sidecar of the extracted fields under
 * `<root>/<provider>/<year>/`. The sidecar is what makes re-processing possible
 * without going back to Gmail.
 */
export async function archiveDocument(
  drive: DriveClientLike,
  args: ArchiveArgs,
): Promise<ArchiveResult> {
  const providerFolder = await ensureFolder(drive, args.providerName, args.rootFolderId);
  const yearFolder = await ensureFolder(drive, String(args.year), providerFolder);
  const original = await uploadFile(drive, {
    name: args.fileName,
    mimeType: args.mimeType,
    body: args.buffer,
    parentId: yearFolder,
  });
  const sidecar = await uploadFile(drive, {
    name: `${args.fileName}.json`,
    mimeType: 'application/json',
    body: JSON.stringify(args.extracted, null, 2),
    parentId: yearFolder,
  });
  return { fileId: original.id, webLink: original.webViewLink, sidecarId: sidecar.id };
}
