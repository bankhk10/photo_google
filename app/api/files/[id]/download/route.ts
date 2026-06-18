import { NextResponse } from 'next/server';
import { getFile, getFileStream } from '@/lib/google';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await getFile(id);
    const stream = await getFileStream(id);

    return new NextResponse(stream as any, {
      headers: {
        'Content-Type': file.mimeType || 'application/octet-stream',
        'Content-Disposition': `attachment; filename="${encodeURIComponent(file.name || 'download')}"`,
      },
    });
  } catch (error: any) {
    return new NextResponse(error.message, { status: 500 });
  }
}
