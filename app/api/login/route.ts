import { NextResponse } from 'next/server';
import { encrypt } from '@/lib/auth';
import { cookies } from 'next/headers';

export async function POST(request: Request) {
  try {
    const { username, password } = await request.json();

    const envUsername = process.env.APP_USERNAME || 'admin';
    const envPassword = process.env.APP_PASSWORD || 'admin';

    if (username === envUsername && password === envPassword) {
      // Create session
      const session = await encrypt({ user: username, time: new Date().toISOString() });

      // Save the session in a cookie
      (await cookies()).set('session', session, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24, // 1 day
      });

      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
    }
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
