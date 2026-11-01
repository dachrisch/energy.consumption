import { describe, it, expect } from 'vitest';
import type { Readable } from 'node:stream';
import {
  FOLDER_MIME,
  archiveDocument,
  driveFor,
  ensureFolder,
  escapeDriveQuery,
  uploadFile,
} from '../drive';
import type { DriveClientLike } from '../drive';

interface FolderRecord {
  id: string;
  name: string;
  parentId?: string;
}

interface UploadRecord {
  id: string;
  name: string;
  mimeType: string;
  body: Buffer | string | Readable;
  parentId: string;
}

function unescapeDriveQuery(value: string | undefined): string | undefined {
  return value?.replace(/\\(['\\])/g, '$1');
}

/** In-memory Drive that behaves like the subset the app uses. */
class FakeDrive implements DriveClientLike {
  readonly folders: FolderRecord[] = [];
  readonly uploads: UploadRecord[] = [];
  readonly queries: string[] = [];
  private counter = 0;

  private nextId(): string {
    this.counter += 1;
    return `id-${this.counter}`;
  }

  files = {
    list: async ({ q }: { q: string }) => {
      this.queries.push(q);
      const name = unescapeDriveQuery(/name = '(.*?)' and/.exec(q)?.[1]);
      const parent = unescapeDriveQuery(/'([^']*)' in parents/.exec(q)?.[1]);
      const files = this.folders
        .filter((folder) => folder.name === name && (parent === undefined || folder.parentId === parent))
        .map((folder) => ({ id: folder.id, name: folder.name }));
      return { data: { files } };
    },
    create: async (params: {
      requestBody: { name: string; parents?: string[]; mimeType?: string };
      media: { mimeType: string; body: Buffer | string | Readable };
    }) => {
      const id = this.nextId();
      if (params.requestBody.mimeType === FOLDER_MIME) {
        this.folders.push({ id, name: params.requestBody.name, parentId: params.requestBody.parents?.[0] });
      } else {
        this.uploads.push({
          id,
          name: params.requestBody.name,
          mimeType: params.media.mimeType,
          body: params.media.body,
          parentId: params.requestBody.parents?.[0] ?? '',
        });
      }
      return { data: { id, webViewLink: `https://drive.example/${id}` } };
    },
    get: async () => ({ data: Buffer.from('') }),
  };
}

const noopDrive: DriveClientLike = {
  files: {
    list: async () => ({ data: { files: [] } }),
    create: async () => ({ data: { id: null } }),
    get: async () => ({ data: null }),
  },
};

describe('escapeDriveQuery', () => {
  it('escapes quotes and backslashes so names cannot break the query', () => {
    expect(escapeDriveQuery(String.raw`a'b\c`)).toBe(String.raw`a\'b\\c`);
    expect(escapeDriveQuery('plain')).toBe('plain');
  });
});

describe('driveFor', () => {
  it('builds a Drive v3 client from the oauth client', async () => {
    const { OAuth2Client } = await import('google-auth-library');
    const client = driveFor(new OAuth2Client('id', 'secret'));
    expect(client.files).toBeDefined();
  });
});

describe('ensureFolder', () => {
  it('creates the folder when it does not exist', async () => {
    const drive = new FakeDrive();

    await expect(ensureFolder(drive, 'Energy Monitor')).resolves.toBe('id-1');

    expect(drive.folders).toEqual([{ id: 'id-1', name: 'Energy Monitor', parentId: undefined }]);
  });

  it('reuses an existing folder instead of duplicating it', async () => {
    const drive = new FakeDrive();
    const first = await ensureFolder(drive, 'Energy Monitor');
    const second = await ensureFolder(drive, 'Energy Monitor');

    expect(second).toBe(first);
    expect(drive.folders).toHaveLength(1);
  });

  it('scopes the lookup to the parent folder and creates inside it', async () => {
    const drive = new FakeDrive();

    const child = await ensureFolder(drive, '2024', 'root-id');

    expect(child).toBe('id-1');
    expect(drive.folders[0].parentId).toBe('root-id');
    expect(drive.queries[0]).toContain("'root-id' in parents");
    expect(drive.queries[0]).toContain(`mimeType = '${FOLDER_MIME}'`);
  });

  it('does not confuse a same-named folder in another parent', async () => {
    const drive = new FakeDrive();
    await ensureFolder(drive, '2024', 'parent-a');

    const other = await ensureFolder(drive, '2024', 'parent-b');

    expect(other).not.toBe('id-1');
    expect(drive.folders).toHaveLength(2);
  });

  it('fails when Drive does not return an id', async () => {
    await expect(ensureFolder(noopDrive, 'Broken')).rejects.toThrow(/did not return an id/);
  });
});

describe('uploadFile', () => {
  it('uploads the body and returns id plus link', async () => {
    const drive = new FakeDrive();

    await expect(uploadFile(drive, {
      name: 'bill.pdf',
      mimeType: 'application/pdf',
      body: Buffer.from('%PDF'),
      parentId: 'folder-id',
    })).resolves.toEqual({ id: 'id-1', webViewLink: 'https://drive.example/id-1' });

    expect(drive.uploads[0]).toMatchObject({
      name: 'bill.pdf',
      mimeType: 'application/pdf',
      parentId: 'folder-id',
    });
  });

  it('fails when Drive does not return an id', async () => {
    await expect(uploadFile(noopDrive, {
      name: 'bill.pdf',
      mimeType: 'application/pdf',
      body: Buffer.from('%PDF'),
      parentId: 'folder-id',
    })).rejects.toThrow(/did not return an id/);
  });

  it('hands googleapis a readable stream for binary bodies', async () => {
    const drive = new FakeDrive();

    await uploadFile(drive, {
      name: 'bill.pdf',
      mimeType: 'application/pdf',
      body: Buffer.from('%PDF-1.4 bill'),
      parentId: 'folder-id',
    });

    // A raw Buffer fails inside googleapis with "part.body.pipe is not a function".
    const body = drive.uploads[0].body;
    expect(typeof body).not.toBe('string');
    expect(Buffer.isBuffer(body)).toBe(false);

    const chunks: Buffer[] = [];
    for await (const chunk of body as Readable) {
      chunks.push(Buffer.from(chunk));
    }
    expect(Buffer.concat(chunks).toString()).toBe('%PDF-1.4 bill');
  });
});

describe('archiveDocument', () => {
  it('files the original plus a JSON sidecar under <root>/<provider>/<year>', async () => {
    const drive = new FakeDrive();
    const extracted = { meterNumber: '1-234', readings: [{ date: '2024-01-01', value: 500 }] };

    const result = await archiveDocument(drive, {
      rootFolderId: 'root',
      providerName: 'Stadtwerke',
      year: 2024,
      fileName: 'Abrechnung.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4'),
      extracted,
    });

    expect(drive.folders.map((folder) => [folder.name, folder.parentId])).toEqual([
      ['Stadtwerke', 'root'],
      ['2024', 'id-1'],
    ]);
    expect(drive.uploads.map((upload) => upload.name)).toEqual(['Abrechnung.pdf', 'Abrechnung.pdf.json']);
    expect(drive.uploads.every((upload) => upload.parentId === 'id-2')).toBe(true);
    expect(JSON.parse(drive.uploads[1].body as string)).toEqual(extracted);
    expect(result).toEqual({
      fileId: 'id-3',
      webLink: 'https://drive.example/id-3',
      sidecarId: 'id-4',
    });
  });
});
