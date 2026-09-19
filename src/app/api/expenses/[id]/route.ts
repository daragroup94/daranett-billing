export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const expense = await prisma.expense.findUnique({
      where: { id }
    });

    if (!expense) {
      return NextResponse.json({ error: 'Data pengeluaran tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json({ success: true, expense });
  } catch (error: any) {
    console.error('Failed to fetch expense:', error);
    return NextResponse.json({ error: 'Gagal mengambil data pengeluaran' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const body = await request.json();
    const { title, category, amount, date, paymentMethod, notes } = body;

    const existing = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data pengeluaran tidak ditemukan' }, { status: 404 });
    }

    const updateData: any = {};
    if (title !== undefined) updateData.title = title.trim();
    if (category !== undefined) updateData.category = category;
    if (amount !== undefined) {
      const parsed = parseFloat(amount);
      if (isNaN(parsed) || parsed <= 0) {
        return NextResponse.json({ error: 'Nominal harus angka valid lebih dari 0' }, { status: 400 });
      }
      updateData.amount = parsed;
    }
    if (date !== undefined) updateData.date = new Date(date);
    if (paymentMethod !== undefined) updateData.paymentMethod = paymentMethod;
    if (notes !== undefined) updateData.notes = notes ? notes.trim() : null;

    const updated = await prisma.expense.update({
      where: { id },
      data: updateData
    });

    // Record system log
    await prisma.systemLog.create({
      data: {
        action: 'EXPENSE_UPDATE',
        message: `Memperbarui pengeluaran "${updated.title}" menjadi Rp ${updated.amount.toLocaleString('id-ID')} [${updated.category}].`
      }
    });

    return NextResponse.json({ success: true, expense: updated });
  } catch (error: any) {
    console.error('Failed to update expense:', error);
    return NextResponse.json({ error: error.message || 'Gagal memperbarui pengeluaran' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const existing = await prisma.expense.findUnique({
      where: { id }
    });

    if (!existing) {
      return NextResponse.json({ error: 'Data pengeluaran tidak ditemukan' }, { status: 404 });
    }

    await prisma.expense.delete({
      where: { id }
    });

    // Record system log
    await prisma.systemLog.create({
      data: {
        action: 'EXPENSE_DELETE',
        message: `Menghapus pengeluaran "${existing.title}" sejumlah Rp ${existing.amount.toLocaleString('id-ID')}.`
      }
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Failed to delete expense:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus data pengeluaran' }, { status: 500 });
  }
}
