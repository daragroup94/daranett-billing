import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const data = await request.json();
    const { username, password } = data;

    if (username === 'admin' && password === 'admin') {
      const response = NextResponse.json({ success: true });
      
      // Set session cookie expiring in 7 days
      response.cookies.set({
        name: 'daranett_session',
        value: 'admin-authorized-session',
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
      });

      return response;
    }

    return NextResponse.json({ error: 'Username atau password salah!' }, { status: 401 });
  } catch (error) {
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
