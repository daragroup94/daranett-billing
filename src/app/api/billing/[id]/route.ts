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
      return NextResponse.json({ error: 'Tagihan tidak ditemukan' }, { status: 404 });
    }

    return NextResponse.json(invoice);
  } catch (error) {
    console.error('Failed to fetch invoice:', error);
    return NextResponse.json({ error: 'Gagal mengambil data tagihan' }, { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    const data = await request.json();
    const { status, paymentMethod, paidAmount, rollover, notes, promiseDate } = data; // status = 'PAID' or 'UNPAID'

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

    let updatedAmount = currentInvoice.amount;
    let logMessage = `Tagihan ${currentInvoice.customer.name} untuk bulan ${currentInvoice.month} ditandai sebagai ${status === 'PAID' ? 'LUNAS (' + (paymentMethod || 'CASH') + ')' : 'BELUM BAYAR'}.`;
    if (notes) {
      logMessage += ` Catatan: "${notes}".`;
    }
    if (promiseDate) {
      logMessage += ` Janji Bayar: ${promiseDate}.`;
    }

    if (status === 'PAID' && paidAmount !== undefined) {
      const numPaid = parseFloat(paidAmount);
      
      // Get all unpaid invoices for this customer, ordered by month asc (oldest first)
      const unpaidInvoices = await prisma.invoice.findMany({
        where: {
          customerId: currentInvoice.customerId,
          status: 'UNPAID'
        },
        orderBy: { month: 'asc' }
      });

      let remainingPayment = numPaid;
      let logMessages = [];
      let lastUpdatedInvoice = null;

      for (const inv of unpaidInvoices) {
        if (remainingPayment <= 0) break;

        const invTotal = inv.amount - inv.discount;

        if (remainingPayment >= invTotal) {
          // Pay this invoice in full
          lastUpdatedInvoice = await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              status: 'PAID',
              paymentMethod: paymentMethod || 'CASH',
              paymentDate: new Date(),
              notes: notes || `Lunas (Bagian dari total bayar Rp ${numPaid})`
            }
          });
          remainingPayment -= invTotal;
          logMessages.push(`Bulan ${inv.month} LUNAS (Rp ${invTotal})`);
        } else {
          // Partial payment for this invoice
          const paidPart = remainingPayment;
          const remainingDebt = invTotal - paidPart;
          const updatedAmount = paidPart + inv.discount;

          lastUpdatedInvoice = await prisma.invoice.update({
            where: { id: inv.id },
            data: {
              status: 'PAID',
              amount: updatedAmount,
              paymentMethod: paymentMethod || 'CASH',
              paymentDate: new Date(),
              notes: notes || `Bayar sebagian Rp ${paidPart} (dari Rp ${invTotal})`
            }
          });

          logMessages.push(`Bulan ${inv.month} dibayar SEBAGIAN (Rp ${paidPart} dari Rp ${invTotal})`);

          if (rollover) {
            // Roll over the sisa hutang to next month
            const [year, month] = inv.month.split('-').map(Number);
            let nextYear = year;
            let nextMonth = month + 1;
            if (nextMonth > 12) {
              nextMonth = 1;
              nextYear += 1;
            }
            const nextMonthStr = `${nextYear}-${String(nextMonth).padStart(2, '0')}`;

            // Check if next month invoice already exists
            const nextInvoice = await prisma.invoice.findUnique({
              where: {
                customerId_month: {
                  customerId: currentInvoice.customerId,
                  month: nextMonthStr
                }
              }
            });

            if (nextInvoice) {
              await prisma.invoice.update({
                where: { id: nextInvoice.id },
                data: { amount: nextInvoice.amount + remainingDebt }
              });
              logMessages.push(`Sisa hutang Rp ${remainingDebt} digabung ke tagihan ${nextMonthStr}`);
            } else {
              await prisma.customer.update({
                where: { id: currentInvoice.customerId },
                data: { carriedOverDebt: { increment: remainingDebt } }
              });
              logMessages.push(`Sisa hutang Rp ${remainingDebt} dicatat untuk tagihan berikutnya`);
            }
          }
          remainingPayment = 0;
        }
      }

      const finalLog = `Menerima pembayaran Rp ${numPaid} untuk ${currentInvoice.customer.name}: ${logMessages.join('. ')}`;
      await prisma.systemLog.create({
        data: {
          action: 'PAYMENT',
          message: finalLog
        }
      });

      return NextResponse.json(lastUpdatedInvoice || currentInvoice);
    }

    const updated = await prisma.invoice.update({
      where: { id },
      data: {
        status,
        amount: updatedAmount,
        paymentMethod: status === 'PAID' ? paymentMethod || 'CASH' : null,
        paymentDate: status === 'PAID' ? new Date() : null,
        notes: notes !== undefined ? notes : undefined,
        promiseDate: promiseDate !== undefined ? (promiseDate ? new Date(promiseDate) : null) : undefined,
      },
    });

    // Create system log for the payment update
    await prisma.systemLog.create({
      data: {
        action: 'PAYMENT',
        message: logMessage
      }
    });



    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update invoice:', error);
    return NextResponse.json({ error: 'Gagal memperbarui status tagihan' }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> | { id: string } }
) {
  try {
    const { id } = await Promise.resolve(params);
    await prisma.invoice.delete({
      where: { id }
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete invoice:', error);
    return NextResponse.json({ error: 'Gagal menghapus tagihan' }, { status: 500 });
  }
}
