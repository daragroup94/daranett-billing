export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);

    // Default to last 6 months if no params provided
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const defaultFromStr = `${defaultFrom.getFullYear()}-${String(defaultFrom.getMonth() + 1).padStart(2, '0')}`;
    const defaultToStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const from = searchParams.get('from') || defaultFromStr;
    const to = searchParams.get('to') || defaultToStr;

    const invoices = await prisma.invoice.findMany({
      where: {
        month: {
          gte: from,
          lte: to,
        },
      },
      orderBy: { month: 'asc' },
    });

    // Group by month
    const monthMap = {};

    for (const invoice of invoices) {
      if (!monthMap[invoice.month]) {
        monthMap[invoice.month] = {
          month: invoice.month,
          totalInvoices: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalRevenue: 0,
          totalUnpaid: 0,
        };
      }

      const entry = monthMap[invoice.month];
      entry.totalInvoices++;

      const netAmount = invoice.amount - (invoice.discount || 0);

      if (invoice.status === 'PAID') {
        entry.paidCount++;
        entry.totalRevenue += netAmount;
      } else {
        entry.unpaidCount++;
        entry.totalUnpaid += netAmount;
      }
    }

    const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate overall totals
    const totals = {
      totalRevenue: 0,
      totalUnpaid: 0,
      totalInvoices: 0,
      paidCount: 0,
      unpaidCount: 0,
    };

    for (const m of months) {
      totals.totalRevenue += m.totalRevenue;
      totals.totalUnpaid += m.totalUnpaid;
      totals.totalInvoices += m.totalInvoices;
      totals.paidCount += m.paidCount;
      totals.unpaidCount += m.unpaidCount;
    }

    const formattedMonths = months.map((m) => ({
      month: m.month,
      totalInvoices: m.totalInvoices,
      paid: m.paidCount,
      unpaid: m.unpaidCount,
      totalRevenue: m.totalRevenue,
      totalTunggakan: m.totalUnpaid,
    }));

    const customers = await prisma.customer.findMany({
      select: { carriedOverDebt: true }
    });
    const totalCarriedOverDebt = customers.reduce((sum, c) => sum + (c.carriedOverDebt || 0), 0);

    const summary = {
      totalRevenue: totals.totalRevenue,
      totalUnpaid: totals.totalUnpaid + totalCarriedOverDebt,
      paidCount: totals.paidCount,
      unpaidCount: totals.unpaidCount,
      totalCarriedOverDebt
    };

    return NextResponse.json({ monthly: formattedMonths, summary });
  } catch (error) {
    console.error('Failed to fetch laporan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 });
  }
}
