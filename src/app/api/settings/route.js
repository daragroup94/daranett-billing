import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'default' }
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to fetch system settings:', error);
    return NextResponse.json({ error: 'Gagal mengambil pengaturan sistem' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { telegramBotToken, telegramChatId } = data;

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        telegramBotToken: telegramBotToken ?? '',
        telegramChatId: telegramChatId ?? '',
      },
      create: {
        id: 'default',
        telegramBotToken: telegramBotToken ?? '',
        telegramChatId: telegramChatId ?? '',
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update system settings:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan sistem' }, { status: 500 });
  }
}
