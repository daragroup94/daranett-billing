import { NextRequest, NextResponse } from 'next/server';
import prisma from '@/lib/db';
import fs from 'fs';
import path from 'path';

function getBackupDir() {
  const dir = path.join(process.cwd(), 'backups');
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

// GET: List all backup files or download a specific backup file
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const downloadFile = searchParams.get('download');

    const backupDir = getBackupDir();

    // If download query param is provided, stream the file to client
    if (downloadFile) {
      const safeFilename = path.basename(downloadFile);
      const filePath = path.join(backupDir, safeFilename);

      if (!fs.existsSync(filePath)) {
        return NextResponse.json({ error: 'File backup tidak ditemukan' }, { status: 404 });
      }

      const fileBuffer = fs.readFileSync(filePath);
      return new Response(fileBuffer, {
        headers: {
          'Content-Type': 'application/json',
          'Content-Disposition': `attachment; filename="${safeFilename}"`,
          'Content-Length': fileBuffer.length.toString(),
        },
      });
    }

    // Otherwise, list all available backups
    const files = fs.readdirSync(backupDir).filter((file) => file.endsWith('.json') || file.endsWith('.sql'));

    const backups = files.map((filename) => {
      const filePath = path.join(backupDir, filename);
      const stats = fs.statSync(filePath);

      let summary = null;
      let appName = 'DaraNet Billing';
      let exportedAt = stats.mtime.toISOString();

      if (filename.endsWith('.json')) {
        try {
          // Read first few KB to extract summary without loading giant files
          const fd = fs.openSync(filePath, 'r');
          const buffer = Buffer.alloc(2048);
          const bytesRead = fs.readSync(fd, buffer, 0, 2048, 0);
          fs.closeSync(fd);
          const headStr = buffer.toString('utf8', 0, bytesRead);

          // Try parsing full json if small, or extract summary
          const parsed = JSON.parse(fs.readFileSync(filePath, 'utf8'));
          if (parsed.summary) summary = parsed.summary;
          if (parsed.exportedAt) exportedAt = parsed.exportedAt;
          if (parsed.appName) appName = parsed.appName;
        } catch {
          // Fallback to stat
        }
      }

      return {
        filename,
        size: stats.size,
        createdAt: exportedAt,
        summary,
        appName,
      };
    }).sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ success: true, backups });
  } catch (error) {
    console.error('Failed to list or download backups:', error);
    return NextResponse.json({ error: 'Gagal memproses daftar backup' }, { status: 500 });
  }
}

// POST: Create a fresh backup from PostgreSQL via Prisma
export async function POST() {
  try {
    const backupDir = getBackupDir();
    const now = new Date();

    // Fetch all database records
    const [packages, customers, invoices, settings, logs] = await Promise.all([
      prisma.package.findMany({ orderBy: { name: 'asc' } }),
      prisma.customer.findMany({ orderBy: { name: 'asc' } }),
      prisma.invoice.findMany({ orderBy: { createdAt: 'desc' } }),
      prisma.systemSettings.findFirst(),
      prisma.systemLog.findMany({ take: 100, orderBy: { createdAt: 'desc' } }),
    ]);

    const backupData = {
      version: '1.0',
      appName: 'DaraNet Billing',
      exportedAt: now.toISOString(),
      summary: {
        packages: packages.length,
        customers: customers.length,
        invoices: invoices.length,
        logs: logs.length,
      },
      data: {
        packages,
        customers,
        invoices,
        settings,
        logs,
      },
    };

    // Format filename: daranett_backup_YYYY-MM-DD_HH-mm-ss.json
    const dateStr = now.toISOString().replace(/T/, '_').replace(/:/g, '-').slice(0, 19);
    const filename = `daranett_backup_${dateStr}.json`;
    const filePath = path.join(backupDir, filename);

    fs.writeFileSync(filePath, JSON.stringify(backupData, null, 2), 'utf8');
    const stats = fs.statSync(filePath);

    // Record system log
    try {
      await prisma.systemLog.create({
        data: {
          action: 'BACKUP_CREATED',
          message: `Backup manual dibuat: ${filename} (${packages.length} paket, ${customers.length} pelanggan, ${invoices.length} tagihan)`,
        },
      });
    } catch {
      // ignore log failure
    }

    return NextResponse.json({
      success: true,
      message: 'Backup database berhasil dibuat!',
      filename,
      downloadUrl: `/api/backup?download=${encodeURIComponent(filename)}`,
      size: stats.size,
      summary: backupData.summary,
      createdAt: now.toISOString(),
    });
  } catch (error: any) {
    console.error('Failed to create backup:', error);
    return NextResponse.json({ error: error.message || 'Gagal membuat backup database' }, { status: 500 });
  }
}

// DELETE: Remove a backup file
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let filename = searchParams.get('file');

    if (!filename) {
      try {
        const body = await request.json();
        filename = body.filename;
      } catch {
        // no body
      }
    }

    if (!filename) {
      return NextResponse.json({ error: 'Nama file backup diperlukan' }, { status: 400 });
    }

    const safeFilename = path.basename(filename);
    const backupDir = getBackupDir();
    const filePath = path.join(backupDir, safeFilename);

    if (!fs.existsSync(filePath)) {
      return NextResponse.json({ error: 'File tidak ditemukan' }, { status: 404 });
    }

    fs.unlinkSync(filePath);

    return NextResponse.json({
      success: true,
      message: `File backup "${safeFilename}" berhasil dihapus.`,
    });
  } catch (error: any) {
    console.error('Failed to delete backup:', error);
    return NextResponse.json({ error: error.message || 'Gagal menghapus file backup' }, { status: 500 });
  }
}

