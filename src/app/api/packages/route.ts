import { NextResponse } from 'next/server';
import prisma from '@/lib/db';

export async function GET() {
  try {
    const packages = await prisma.package.findMany({
      orderBy: { price: 'asc' },
      include: {
        _count: {
          select: { customers: true }
        }
      }
    });
    return NextResponse.json(packages);
  } catch (error) {
    console.error('Failed to fetch packages:', error);
    return NextResponse.json({ error: 'Gagal mengambil data paket' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const data = await request.json();
    const { name, speedUpload, speedDownload, price, description } = data;

    if (!name || !speedUpload || !speedDownload || !price) {
      return NextResponse.json({ error: 'Semua field wajib diisi' }, { status: 400 });
    }

    const newPackage = await prisma.package.create({
      data: {
        name,
        speedUpload: parseInt(speedUpload),
        speedDownload: parseInt(speedDownload),
        price: parseFloat(price),
        description,
      },
    });

    return NextResponse.json(newPackage, { status: 201 });
  } catch (error) {
    console.error('Failed to create package:', error);
    return NextResponse.json({ error: 'Gagal membuat paket' }, { status: 500 });
  }
}
