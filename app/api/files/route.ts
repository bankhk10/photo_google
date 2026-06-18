import { NextResponse } from 'next/server';
import { listFiles } from '@/lib/google';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const pageToken = searchParams.get('pageToken') || undefined;
    
    const data = await listFiles(pageToken);
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error listing files:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch files' }, { status: 500 });
  }
}
