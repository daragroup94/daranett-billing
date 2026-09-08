import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const response = NextResponse.json({ success: true });
    
    // Clear session cookie
    response.cookies.set({
      name: 'daranett_session',
      value: '',
      httpOnly: true,
      path: '/',
      maxAge: 0, // Instant expiry
    });

    return response;
  } catch (error) {
    return NextResponse.json({ error: 'Gagal melakukan logout' }, { status: 500 });
  }
}
