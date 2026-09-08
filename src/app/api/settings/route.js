export const dynamic = 'force-dynamic';

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
    const { 
      telegramBotToken, telegramChatId, fonnteBotToken, fonnteTargetPhone,
      mikrotikHost, mikrotikPort, mikrotikUsername, mikrotikPassword, mikrotikIsolirProfile,
      midtransServerKey, midtransClientKey, midtransIsProduction,
      cronToken
    } = data;

    const settings = await prisma.systemSettings.upsert({
      where: { id: 'default' },
      update: {
        telegramBotToken: telegramBotToken !== undefined ? telegramBotToken : undefined,
        telegramChatId: telegramChatId !== undefined ? telegramChatId : undefined,
        fonnteBotToken: fonnteBotToken !== undefined ? fonnteBotToken : undefined,
        fonnteTargetPhone: fonnteTargetPhone !== undefined ? fonnteTargetPhone : undefined,
        
        mikrotikHost: mikrotikHost !== undefined ? mikrotikHost : undefined,
        mikrotikPort: mikrotikPort !== undefined ? parseInt(mikrotikPort) : undefined,
        mikrotikUsername: mikrotikUsername !== undefined ? mikrotikUsername : undefined,
        mikrotikPassword: mikrotikPassword !== undefined ? mikrotikPassword : undefined,
        mikrotikIsolirProfile: mikrotikIsolirProfile !== undefined ? mikrotikIsolirProfile : undefined,

        midtransServerKey: midtransServerKey !== undefined ? midtransServerKey : undefined,
        midtransClientKey: midtransClientKey !== undefined ? midtransClientKey : undefined,
        midtransIsProduction: midtransIsProduction !== undefined ? !!midtransIsProduction : undefined,

        cronToken: cronToken !== undefined ? cronToken : undefined,
      },
      create: {
        id: 'default',
        telegramBotToken: telegramBotToken ?? '',
        telegramChatId: telegramChatId ?? '',
        fonnteBotToken: fonnteBotToken ?? '',
        fonnteTargetPhone: fonnteTargetPhone ?? '',
        
        mikrotikHost: mikrotikHost ?? '',
        mikrotikPort: mikrotikPort ? parseInt(mikrotikPort) : 80,
        mikrotikUsername: mikrotikUsername ?? '',
        mikrotikPassword: mikrotikPassword ?? '',
        mikrotikIsolirProfile: mikrotikIsolirProfile ?? 'ISOLIR',

        midtransServerKey: midtransServerKey ?? '',
        midtransClientKey: midtransClientKey ?? '',
        midtransIsProduction: !!midtransIsProduction,

        cronToken: cronToken ?? '',
      }
    });

    return NextResponse.json(settings);
  } catch (error) {
    console.error('Failed to update system settings:', error);
    return NextResponse.json({ error: 'Gagal menyimpan pengaturan sistem' }, { status: 500 });
  }
}
