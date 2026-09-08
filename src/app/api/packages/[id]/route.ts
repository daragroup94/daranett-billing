import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET(request, { params }) {
  try {
    const { id } = params;
    const item = await prisma.package.findUnique({
      where: { id },
    });
    if (!item) {
      return NextResponse.json({ error: 'Paket tidak ditemukan' }, { status: 404 });
    }
    return NextResponse.json(item);
  } catch (error) {
    return NextResponse.json({ error: 'Gagal mengambil detail paket' }, { status: 500 });
  }
}

export async function PUT(request, { params }) {
  try {
    const { id } = params;
    const data = await request.json();
    const { name, speedUpload, speedDownload, price, description } = data;

    const updated = await prisma.package.update({
      where: { id },
      data: {
        name,
        speedUpload: parseInt(speedUpload),
        speedDownload: parseInt(speedDownload),
        price: parseFloat(price),
        description,
      },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.error('Failed to update package:', error);
    return NextResponse.json({ error: 'Gagal memperbarui paket' }, { status: 500 });
  }
}

export async function DELETE(request, { params }) {
  try {
    const { id } = params;

    // Check if there are active customers using this package
    const customerCount = await prisma.customer.count({
      where: { packageId: id },
    });

    if (customerCount > 0) {
      return NextResponse.json(
        { error: `Tidak bisa menghapus paket karena masih digunakan oleh ${customerCount} pelanggan.` },
        { status: 400 }
      );
    }

    await prisma.package.delete({
      where: { id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to delete package:', error);
    return NextResponse.json({ error: 'Gagal menghapus paket' }, { status: 500 });
  }
}
