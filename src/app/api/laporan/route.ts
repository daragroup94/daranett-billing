export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);

    // Default to last 6 months if no params provided
    const now = new Date();
    const defaultFrom = new Date(now.getFullYear(), now.getMonth() - 5, 1);
    const defaultFromStr = `${defaultFrom.getFullYear()}-${String(defaultFrom.getMonth() + 1).padStart(2, '0')}`;
    const defaultToStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const from = searchParams.get('from') || defaultFromStr;
    const to = searchParams.get('to') || defaultToStr;

    // Calculate Date boundaries for expenses
    const [fromY, fromM] = from.split('-').map(Number);
    const [toY, toM] = to.split('-').map(Number);
    const fromDate = new Date(fromY, fromM - 1, 1, 0, 0, 0, 0);
    const toDate = new Date(toY, toM, 0, 23, 59, 59, 999);

    // Fetch Invoices and Expenses in parallel
    const [invoices, expenses] = await Promise.all([
      prisma.invoice.findMany({
        where: {
          month: {
            gte: from,
            lte: to,
          },
        },
        orderBy: { month: 'asc' },
      }),
      prisma.expense.findMany({
        where: {
          date: {
            gte: fromDate,
            lte: toDate,
          },
        },
        orderBy: { date: 'asc' },
      }),
    ]);

    interface MonthStat {
      month: string;
      totalInvoices: number;
      paidCount: number;
      unpaidCount: number;
      totalRevenue: number;
      totalUnpaid: number;
      totalExpenses: number;
      netProfit: number;
    }

    // Group by month
    const monthMap: Record<string, MonthStat> = {};

    const initMonth = (m: string) => {
      if (!monthMap[m]) {
        monthMap[m] = {
          month: m,
          totalInvoices: 0,
          paidCount: 0,
          unpaidCount: 0,
          totalRevenue: 0,
          totalUnpaid: 0,
          totalExpenses: 0,
          netProfit: 0,
        };
      }
    };

    // Process Invoices
    for (const invoice of invoices) {
      initMonth(invoice.month);
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

    // Process Expenses
    for (const exp of expenses) {
      const expDate = new Date(exp.date);
      const mStr = `${expDate.getFullYear()}-${String(expDate.getMonth() + 1).padStart(2, '0')}`;
      initMonth(mStr);
      monthMap[mStr].totalExpenses += exp.amount;
    }

    // Calculate netProfit for each month
    for (const mKey of Object.keys(monthMap)) {
      monthMap[mKey].netProfit = monthMap[mKey].totalRevenue - monthMap[mKey].totalExpenses;
    }

    const months = Object.values(monthMap).sort((a, b) => a.month.localeCompare(b.month));

    // Calculate overall totals
    const totals = {
      totalRevenue: 0,
      totalUnpaid: 0,
      totalExpenses: 0,
      netProfit: 0,
      totalInvoices: 0,
      paidCount: 0,
      unpaidCount: 0,
    };

    for (const m of months) {
      totals.totalRevenue += m.totalRevenue;
      totals.totalUnpaid += m.totalUnpaid;
      totals.totalExpenses += m.totalExpenses;
      totals.netProfit += m.netProfit;
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
      totalExpenses: m.totalExpenses,
      netProfit: m.netProfit,
    }));

    const customers = await prisma.customer.findMany({
      select: { carriedOverDebt: true },
    });
    const totalCarriedOverDebt = customers.reduce((sum, c) => sum + (c.carriedOverDebt || 0), 0);

    const summary = {
      totalRevenue: totals.totalRevenue,
      totalUnpaid: totals.totalUnpaid + totalCarriedOverDebt,
      totalExpenses: totals.totalExpenses,
      netProfit: totals.netProfit,
      paidCount: totals.paidCount,
      unpaidCount: totals.unpaidCount,
      totalCarriedOverDebt,
    };

    return NextResponse.json({ monthly: formattedMonths, summary });
  } catch (error: any) {
    console.error('Failed to fetch laporan:', error);
    return NextResponse.json({ error: 'Gagal mengambil data laporan' }, { status: 500 });
  }
}
