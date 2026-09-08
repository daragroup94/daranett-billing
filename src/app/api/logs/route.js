export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const logs = await prisma.systemLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });
    return NextResponse.json(logs);
  } catch (error) {
    console.error('Failed to fetch system logs:', error);
    return NextResponse.json({ error: 'Gagal memuat log sistem' }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    await prisma.systemLog.deleteMany();
    return NextResponse.json({ success: true, message: 'Log berhasil dibersihkan!' });
  } catch (error) {
    console.error('Failed to clear system logs:', error);
    return NextResponse.json({ error: 'Gagal membersihkan log' }, { status: 500 });
  }
}
