import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

export async function POST(request: NextRequest) {
  try {
    let backupContent = '';
    let sourceName = '';

    const contentType = request.headers.get('content-type') || '';

    if (contentType.includes('multipart/form-data')) {
      const formData = await request.formData();
      const file = formData.get('file') as File | null;
      if (!file) {
        return NextResponse.json({ error: 'File backup tidak ditemukan pada upload.' }, { status: 400 });
      }
      sourceName = file.name;
      backupContent = await file.text();
    } else {
      const body = await request.json();
      if (!body.filename) {
        return NextResponse.json({ error: 'Nama file backup diperlukan.' }, { status: 400 });
      }
      const safeFilename = path.basename(body.filename);
      const filePath = path.join(process.cwd(), 'backups', safeFilename);
      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: `File backup "${safeFilename}" tidak ditemukan di server.` }, { status: 404 });
      }
      sourceName = safeFilename;
      backupContent = fs.readFileSync(filePath, 'utf8');
    }

    let parsed: any;
    try {
      parsed = JSON.parse(backupContent);
    } catch {
      return NextResponse.json({ error: 'Format file tidak valid. Pastikan file berformat JSON backup DaraNet.' }, { status: 400 });
    }

    const data = parsed.data || parsed;

    if (!data.packages && !data.customers && !data.invoices) {
      return NextResponse.json({
        error: 'Struktur file backup tidak sesuai (tidak ditemukan data packages, customers, atau invoices).',
      }, { status: 400 });
    }

    let restoredPackages = 0;
    let restoredCustomers = 0;
    let restoredInvoices = 0;
    let restoredSettings = false;

    // 1. Restore Settings if present
    if (data.settings && typeof data.settings === 'object') {
      try {
        const { id, updatedAt, ...restSettings } = data.settings;
        await prisma.systemSettings.upsert({
          where: { id: id || 'default' },
          create: {
            id: id || 'default',
            ...restSettings,
          },
          update: {
            ...restSettings,
          },
        });
        restoredSettings = true;
      } catch (e) {
        console.warn('Warning restoring system settings:', e);
      }
    }

    // 2. Restore Packages
    if (Array.isArray(data.packages)) {
      for (const pkg of data.packages) {
        if (!pkg.id || !pkg.name) continue;
        await prisma.package.upsert({
          where: { id: pkg.id },
          create: {
            id: pkg.id,
            name: pkg.name,
            speedUpload: Number(pkg.speedUpload) || 0,
            speedDownload: Number(pkg.speedDownload) || 0,
            price: Number(pkg.price) || 0,
            description: pkg.description ?? null,
            createdAt: pkg.createdAt ? new Date(pkg.createdAt) : new Date(),
            updatedAt: pkg.updatedAt ? new Date(pkg.updatedAt) : new Date(),
          },
          update: {
            name: pkg.name,
            speedUpload: Number(pkg.speedUpload) || 0,
            speedDownload: Number(pkg.speedDownload) || 0,
            price: Number(pkg.price) || 0,
            description: pkg.description ?? null,
          },
        });
        restoredPackages++;
      }
    }

    // 3. Restore Customers
    if (Array.isArray(data.customers)) {
      for (const cust of data.customers) {
        if (!cust.id || !cust.name || !cust.packageId) continue;
        await prisma.customer.upsert({
          where: { id: cust.id },
          create: {
            id: cust.id,
            name: cust.name,
            phone: cust.phone || '',
            address: cust.address || '',
            wilayah: cust.wilayah ?? null,
            ipAddress: cust.ipAddress ?? null,
            pppoeUsername: cust.pppoeUsername ?? null,
            pppoePassword: cust.pppoePassword ?? null,
            dueDate: Number(cust.dueDate) || 10,
            dueTime: cust.dueTime || '10:00',
            discount: Number(cust.discount) || 0,
            carriedOverDebt: Number(cust.carriedOverDebt) || 0,
            status: cust.status || 'ACTIVE',
            packageId: cust.packageId,
            joinDate: cust.joinDate ? new Date(cust.joinDate) : new Date(),
            createdAt: cust.createdAt ? new Date(cust.createdAt) : new Date(),
            updatedAt: cust.updatedAt ? new Date(cust.updatedAt) : new Date(),
          },
          update: {
            name: cust.name,
            phone: cust.phone || '',
            address: cust.address || '',
            wilayah: cust.wilayah ?? null,
            ipAddress: cust.ipAddress ?? null,
            pppoeUsername: cust.pppoeUsername ?? null,
            pppoePassword: cust.pppoePassword ?? null,
            dueDate: Number(cust.dueDate) || 10,
            dueTime: cust.dueTime || '10:00',
            discount: Number(cust.discount) || 0,
            carriedOverDebt: Number(cust.carriedOverDebt) || 0,
            status: cust.status || 'ACTIVE',
            packageId: cust.packageId,
          },
        });
        restoredCustomers++;
      }
    }

    // 4. Restore Invoices
    if (Array.isArray(data.invoices)) {
      for (const inv of data.invoices) {
        if (!inv.id || !inv.customerId || !inv.month) continue;
        await prisma.invoice.upsert({
          where: { id: inv.id },
          create: {
            id: inv.id,
            customerId: inv.customerId,
            month: inv.month,
            amount: Number(inv.amount) || 0,
            discount: Number(inv.discount) || 0,
            status: inv.status || 'UNPAID',
            paymentDate: inv.paymentDate ? new Date(inv.paymentDate) : null,
            paymentMethod: inv.paymentMethod ?? null,
            notes: inv.notes ?? null,
            promiseDate: inv.promiseDate ? new Date(inv.promiseDate) : null,
            createdAt: inv.createdAt ? new Date(inv.createdAt) : new Date(),
            updatedAt: inv.updatedAt ? new Date(inv.updatedAt) : new Date(),
          },
          update: {
            customerId: inv.customerId,
            month: inv.month,
            amount: Number(inv.amount) || 0,
            discount: Number(inv.discount) || 0,
            status: inv.status || 'UNPAID',
            paymentDate: inv.paymentDate ? new Date(inv.paymentDate) : null,
            paymentMethod: inv.paymentMethod ?? null,
            notes: inv.notes ?? null,
            promiseDate: inv.promiseDate ? new Date(inv.promiseDate) : null,
          },
        });
        restoredInvoices++;
      }
    }

    // Record system log
    try {
      await prisma.systemLog.create({
        data: {
          action: 'DATABASE_RESTORED',
          message: `Restore database berhasil dari ${sourceName}: ${restoredPackages} paket, ${restoredCustomers} pelanggan, ${restoredInvoices} tagihan.`,
        },
      });
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      message: `Database berhasil dipulihkan dari "${sourceName}"!`,
      stats: {
        packages: restoredPackages,
        customers: restoredCustomers,
        invoices: restoredInvoices,
        settings: restoredSettings,
      },
    });
  } catch (error: any) {
    console.error('Failed to restore database:', error);
    return NextResponse.json({ error: error.message || 'Gagal memulihkan database' }, { status: 500 });
  }
}
