import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncCustomerToMikrotik } from '@/lib/mikrotik';
import crypto from 'crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    console.log('[Midtrans-Webhook] Received notification:', body);

    const { order_id, transaction_status, payment_type, signature_key, gross_amount } = body;

    if (!order_id || !transaction_status) {
      return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 });
    }

    const invoiceId = order_id.split('-')[0];

    // Verify signature key
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (settings && settings.midtransServerKey) {
      const statusCode = body.status_code;
      const verifyString = order_id + statusCode + gross_amount + settings.midtransServerKey;
      const sha512 = crypto.createHash('sha512').update(verifyString).digest('hex');

      if (sha512 !== signature_key) {
        console.error('[Midtrans-Webhook] Signature mismatch!');
        return NextResponse.json({ error: 'Signature mismatch' }, { status: 401 });
      }
    }

    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { customer: true }
    });

    if (!invoice) {
      console.error('[Midtrans-Webhook] Invoice not found:', invoiceId);
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    const isSuccess = transaction_status === 'settlement' || transaction_status === 'capture';

    if (isSuccess && invoice.status !== 'PAID') {
      // 1. Mark as PAID
      const updatedInvoice = await prisma.invoice.update({
        where: { id: invoiceId },
        data: {
          status: 'PAID',
          paymentMethod: payment_type ? payment_type.toUpperCase() : 'MIDTRANS',
          paymentDate: new Date()
        }
      });

      await prisma.systemLog.create({
        data: {
          action: 'PAYMENT_MIDTRANS',
          message: `Pembayaran online lunas untuk ${invoice.customer.name} senilai Rp ${(invoice.amount - invoice.discount).toLocaleString('id-ID')} via ${payment_type || 'Midtrans'}.`
        }
      });

      // 2. Reactivate customer if not active
      if (invoice.customer.status !== 'ACTIVE') {
        const oldStatus = invoice.customer.status;
        const updatedCust = await prisma.customer.update({
          where: { id: invoice.customerId },
          data: { status: 'ACTIVE' }
        });

        await prisma.systemLog.create({
          data: {
            action: 'STATUS_CHANGE',
            message: `Mengubah status ${invoice.customer.name} dari ${oldStatus} menjadi ACTIVE karena pembayaran Midtrans lunas.`
          }
        });

        await syncCustomerToMikrotik(updatedCust, 'ACTIVE');
      }

      console.log(`[Midtrans-Webhook] Invoice ${invoiceId} marked as paid successfully.`);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Midtrans-Webhook-Error] Processing failed:', error);
    return NextResponse.json({ error: error.message || 'Terjadi kesalahan internal' }, { status: 500 });
  }
}
