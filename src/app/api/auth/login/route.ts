import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import rateLimit from '@/lib/rate-limit';

const limiter = rateLimit({
  interval: 15 * 60 * 1000, // 15 minutes
  uniqueTokenPerInterval: 500,
});

export async function POST(request) {
  try {
    // Rate limiting: max 5 login attempts per 15 minutes per IP
    const forwarded = request.headers.get('x-forwarded-for');
    const ip = forwarded ? forwarded.split(',')[0].trim() : 'unknown';
    
    try {
      await limiter.check(5, `login_${ip}`);
    } catch {
      return NextResponse.json(
        { error: 'Terlalu banyak percobaan login. Silakan coba lagi dalam 15 menit.' }, 
        { status: 429 }
      );
    }

    const data = await request.json();
    const { username, password } = data;

    if (username !== 'admin') {
      return NextResponse.json({ error: 'Username atau password salah!' }, { status: 401 });
    }

    // Get stored admin password from SystemSettings
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'default' }
      });
    }

    const storedPassword = settings.adminPassword || 'admin';

    // Check password - support both hashed and legacy plain text
    let isMatch = false;
    if (storedPassword.startsWith('$2')) {
      isMatch = await bcrypt.compare(password, storedPassword);
    } else {
      isMatch = password === storedPassword;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Username atau password salah!' }, { status: 401 });
    }

    // Generate unique session token
    const sessionToken = uuidv4();

    const response = NextResponse.json({ success: true });
    
    // Set session cookie with dynamic token, expiring in 7 days
    response.cookies.set({
      name: 'daranett_session',
      value: sessionToken,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    });

    return response;
  } catch (error) {
    console.error('Login error:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
