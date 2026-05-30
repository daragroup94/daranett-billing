import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function POST(request) {
  try {
    const data = await request.json();
    const { month } = data; // e.g. "2026-05"

    if (!month || !/^\d{4}-\d{2}$/.test(month)) {
      return NextResponse.json({ error: 'Format bulan harus YYYY-MM' }, { status: 400 });
    }

    // Get all customers who are ACTIVE or GRACE
    const customers = await prisma.customer.findMany({
      where: {
        status: { in: ['ACTIVE', 'GRACE_PERIOD'] }
      },
      include: {
        package: true
      }
    });

    let generatedCount = 0;
    let skippedCount = 0;

    // Use prisma transactions or process them. For safety, process them.
    for (const customer of customers) {
      // Check if invoice already exists
      const existing = await prisma.invoice.findUnique({
        where: {
          customerId_month: {
            customerId: customer.id,
            month: month
          }
        }
      });

      if (!existing) {
        // Create new UNPAID invoice
        await prisma.invoice.create({
          data: {
            customerId: customer.id,
            month: month,
            amount: customer.package.price,
            discount: customer.discount || 0,
            status: 'UNPAID',
          }
        });
        generatedCount++;
      } else {
        skippedCount++;
      }
    }

    return NextResponse.json({
      success: true,
      message: `Berhasil memproses tagihan bulan ${month}.`,
      generated: generatedCount,
      skipped: skippedCount
    });
  } catch (error) {
    console.error('Failed to generate billing:', error);
    return NextResponse.json({ error: 'Gagal membuat tagihan bulanan' }, { status: 500 });
  }
}
