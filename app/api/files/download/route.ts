import { NextResponse } from 'next/server';
import { getFileStream, getFile } from '@/lib/google';
const archiver = require('archiver');
import { PassThrough } from 'stream';

// Prevent Next.js from complaining about edge runtime
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
  try {
    const { fileIds } = await request.json();
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return NextResponse.json({ error: 'No files provided' }, { status: 400 });
    }

    if (fileIds.length > 50) {
      return NextResponse.json({ error: 'Maximum 50 files allowed' }, { status: 400 });
    }

    const headers = new Headers();
    headers.set('Content-Type', 'application/zip');
    headers.set('Content-Disposition', `attachment; filename="archive_${new Date().getTime()}.zip"`);

    const passThrough = new PassThrough();
    const archive = archiver('zip', { zlib: { level: 0 } }); // level 0 for faster processing, Drive files are already compressed

    archive.on('error', (err: any) => {
      console.error('Archive error:', err);
    });

    archive.pipe(passThrough);

    (async () => {
      for (const id of fileIds) {
        try {
          const fileMeta = await getFile(id);
          const fileStream = await getFileStream(id);
          // Wait for each file to append before moving to the next to keep memory usage low
          archive.append(fileStream as any, { name: fileMeta.name || `file_${id}` });
        } catch (err) {
          console.error(`Failed to append file ${id}`, err);
        }
      }
      archive.finalize();
    })();

    // In Next.js, we can pass the Node stream directly by casting to any
    // or using Next.js specific wrapper if needed. But casting to any works.
    return new NextResponse(passThrough as any, { headers });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
