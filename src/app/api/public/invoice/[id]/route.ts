import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import { syncCustomerToMikrotik } from '@/lib/mikrotik';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);

    const invoice = await prisma.invoice.findUnique({
      where: { id },
      include: {
        customer: {
          include: {
            package: true
          }
        }
      }
    });

    if (!invoice) {
      return NextResponse.json({ error: 'Invoice tidak ditemukan' }, { status: 404 });
    }

    // Retrieve Midtrans settings
    const settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    let snapToken = null;
    let clientKey = null;
    let midtransConfigured = false;

    if (settings && settings.midtransServerKey && invoice.status === 'UNPAID') {
      midtransConfigured = true;
      clientKey = settings.midtransClientKey;

      const orderId = `${invoice.id}-${Date.now()}`; // Unique order ID for Midtrans (retrying payment)
      const amount = invoice.amount - (invoice.discount || 0);

      // Call Midtrans Snap API using fetch
      const isProduction = settings.midtransIsProduction;
      const midtransUrl = isProduction
        ? 'https://app.midtrans.com/snap/v1/transactions'
        : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

      const authHeader = Buffer.from(`${settings.midtransServerKey}:`).toString('base64');

      try {
        const response = await fetch(midtransUrl, {
          method: 'POST',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json',
            'Authorization': `Basic ${authHeader}`
          },
          body: JSON.stringify({
            transaction_details: {
              order_id: orderId,
              gross_amount: amount
            },
            customer_details: {
              first_name: invoice.customer.name,
              phone: invoice.customer.phone
            },
            item_details: [
              {
                id: invoice.customer.packageId,
                price: invoice.amount,
                quantity: 1,
                name: `Paket ${invoice.customer.package.name}`
              },
              ...(invoice.discount > 0 ? [{
                id: 'discount',
                price: -invoice.discount,
                quantity: 1,
                name: 'Potongan Tagihan'
              }] : [])
            ]
          })
        });

        if (response.ok) {
          const resData = await response.json();
          snapToken = resData.token;
        } else {
          const errText = await response.text();
          console.error('[Midtrans-API] Midtrans returned error:', errText);
        }
      } catch (err) {
        console.error('[Midtrans-API] Fetch connection failed:', err);
      }
    }

    return NextResponse.json({
      invoice,
      midtrans: {
        configured: midtransConfigured,
        snapToken,
        clientKey,
        isProduction: settings?.midtransIsProduction || false
      }
    });
  } catch (error) {
    console.error('[Public-Invoice-Error] GET failed:', error);
    return NextResponse.json({ error: 'Gagal memuat tagihan' }, { status: 500 });
  }
}

