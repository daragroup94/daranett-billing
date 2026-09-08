import { NextResponse } from 'next/server';
import { sendWhatsAppOverdueReport } from '@/lib/billing-utils';

export async function POST() {
  try {
    const success = await sendWhatsAppOverdueReport(true);
    
    if (success) {
      return NextResponse.json({ success: true, message: 'Pesan tagihan (overdue) berhasil dikirim via WhatsApp Fonnte!' });
    } else {
      return NextResponse.json({ error: 'Gagal mengirim pesan atau tidak ada pelanggan yang menunggak.' }, { status: 400 });
    }
  } catch (error) {
    console.error('Failed to trigger WhatsApp manual send:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
