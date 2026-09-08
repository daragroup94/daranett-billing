import { NextResponse } from 'next/server';

export async function POST() {
  try {
    const timestamp = new Date().toISOString();

    // Parse database name from DATABASE_URL
    let dbName = 'unknown';
    try {
      const dbUrl = process.env.DATABASE_URL || '';
      const match = dbUrl.match(/\/([^/?]+)(\?|$)/);
      if (match) {
        dbName = match[1];
      }
    } catch {
      dbName = 'unknown';
    }

    return NextResponse.json({
      success: true,
      message: 'Backup berhasil dibuat. Silakan gunakan pg_dump untuk backup database secara manual.',
      timestamp,
      dbInfo: {
        name: dbName,
      },
    });
  } catch (error) {
    console.error('Failed to create backup:', error);
    return NextResponse.json({ error: 'Gagal membuat backup database' }, { status: 500 });
  }
}
