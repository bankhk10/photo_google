import { NextResponse } from 'next/server';
import { getFile } from '@/lib/google';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const file = await getFile(id);
    return NextResponse.json(file);
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
