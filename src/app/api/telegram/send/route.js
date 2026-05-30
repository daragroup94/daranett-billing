import { NextResponse } from 'next/server';
import { sendTelegramOverdueReport } from '@/lib/billing-utils';

export async function POST(request) {
  try {
    const success = await sendTelegramOverdueReport(true); // force send immediately
    if (success) {
      return NextResponse.json({ success: true, message: 'Laporan tunggakan pelanggan berhasil dikirim ke Telegram!' });
    } else {
      return NextResponse.json({ error: 'Gagal mengirim laporan. Pastikan konfigurasi Bot Token & Chat ID benar, serta terdapat pelanggan yang menunggak (melewati jatuh tempo).' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to trigger manual Telegram send:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
