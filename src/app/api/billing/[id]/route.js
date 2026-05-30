import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
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
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json({ error: 'Gagal mengambil data tagihan' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const { status, paymentMethod } = data; // status = 'PAID' or 'UNPAID'

    if (!status) {
      return NextResponse.json({ error: 'Status wajib ditentukan' }, { status: 400 });
    }

    const currentInvoice = await prisma.invoice.findUnique({
      where: { id },
      include: { customer: true }
    });

    if (!currentInvoice) {
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        paymentMethod: status === 'PAID' ? paymentMethod || 'CASH' : null,
        paymentDate: status === 'PAID' ? new Date() : null,
      },
    });

    // Automatically update customer status to ACTIVE if they were suspended and paid their bill
    if (status === 'PAID' && currentInvoice.customer.status !== 'ACTIVE') {
      await prisma.customer.update({
        where: { id: currentInvoice.customerId },
        data: { status: 'ACTIVE' }
      });
    }

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status tagihan' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;
    await prisma.invoice.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Gagal menghapus tagihan' }, { status: 500 });
  }
}
