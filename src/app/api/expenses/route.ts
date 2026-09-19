export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const month = searchParams.get('month');
    const from = searchParams.get('from');
    const to = searchParams.get('to');
    const category = searchParams.get('category');
    const search = searchParams.get('search');

    const where: any = {};

    // Date filtering
    if (month) {
      const [year, m] = month.split('-').map(Number);
      const startDate = new Date(year, m - 1, 1, 0, 0, 0, 0);
      const endDate = new Date(year, m, 0, 23, 59, 59, 999);
      where.date = {
        gte: startDate,
        lte: endDate
      };
    } else if (from || to) {
      where.date = {};
      if (from) {
        where.date.gte = new Date(`${from}T00:00:00.000Z`);
      }
      if (to) {
        where.date.lte = new Date(`${to}T23:59:59.999Z`);
      }
    }

    // Category filtering
    if (category && category !== 'ALL') {
      where.category = category;
    }

    // Search filtering
    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { notes: { contains: search, mode: 'insensitive' } }
      ];
    }

    // Fetch expenses
    const expenses = await prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' }
    });

    const totalExpenses = expenses.reduce((sum, item) => sum + item.amount, 0);

    // Calculate Category Breakdown
    const categoryTotals: Record<string, { count: number; total: number }> = {};
    for (const item of expenses) {
      if (!categoryTotals[item.category]) {
        categoryTotals[item.category] = { count: 0, total: 0 };
      }
      categoryTotals[item.category].count += 1;
      categoryTotals[item.category].total += item.amount;
    }

    // Also fetch paid invoices for matching month/period to provide cashflow context
    let incomeWhere: any = { status: 'PAID' };
    if (month) {
      incomeWhere.month = month;
    }
    const paidInvoices = await prisma.invoice.findMany({
      where: incomeWhere,
      select: { amount: true, discount: true }
    });

    const totalIncome = paidInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
    const netProfit = totalIncome - totalExpenses;
    const profitMargin = totalIncome > 0 ? ((netProfit / totalIncome) * 100).toFixed(1) : '0';

    return NextResponse.json({
      success: true,
      expenses,
      totalExpenses,
      categoryTotals,
      cashflow: {
        totalIncome,
        totalExpenses,
        netProfit,
        profitMargin: parseFloat(profitMargin)
      }
    });
  } catch (error: any) {
    console.error('Failed to fetch expenses:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengeluaran' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, category, amount, date, paymentMethod, notes } = body;

    if (!title || !title.trim()) {
      return NextResponse.json({ error: 'Judul pengeluaran wajib diisi' }, { status: 400 });
    }

    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount) || parsedAmount <= 0) {
      return NextResponse.json({ error: 'Nominal pengeluaran harus berupa angka positif' }, { status: 400 });
    }

    const expenseDate = date ? new Date(date) : new Date();

    const expense = await prisma.expense.create({
      data: {
        title: title.trim(),
        category: category || 'OTHER',
        amount: parsedAmount,
        date: expenseDate,
        paymentMethod: paymentMethod || 'TRANSFER',
        notes: notes ? notes.trim() : null
      }
    });

    // Record system log
    await prisma.systemLog.create({
      data: {
        action: 'EXPENSE_CREATE',
        message: `Pencatatan pengeluaran: "${expense.title}" sebesar Rp ${parsedAmount.toLocaleString('id-ID')} [${expense.category}].`
      }
    });

    return NextResponse.json({ success: true, expense }, { status: 201 });
  } catch (error: any) {
    console.error('Failed to create expense:', error);
    return NextResponse.json({ error: error.message || 'Gagal menyimpan pengeluaran' }, { status: 500 });
  }
}
