import { NextResponse } from 'next/server';
import prisma from '@/lib/db';
import bcrypt from 'bcryptjs';

export async function POST(request) {
  try {
    const data = await request.json();
    const { currentPassword, newPassword } = data;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Password lama dan baru wajib diisi.' }, { status: 400 });
    }

    if (newPassword.length < 4) {
      return NextResponse.json({ error: 'Password baru minimal 4 karakter.' }, { status: 400 });
    }

    // Get current stored password from SystemSettings
    let settings = await prisma.systemSettings.findUnique({
      where: { id: 'default' }
    });

    if (!settings) {
      settings = await prisma.systemSettings.create({
        data: { id: 'default' }
      });
    }

    const storedPassword = settings.adminPassword || 'admin';

    // Check if stored password is hashed (bcrypt hashes start with $2)
    let isMatch = false;
    if (storedPassword.startsWith('$2')) {
      isMatch = await bcrypt.compare(currentPassword, storedPassword);
    } else {
      // Legacy plain text comparison (first time change)
      isMatch = currentPassword === storedPassword;
    }

    if (!isMatch) {
      return NextResponse.json({ error: 'Password saat ini salah!' }, { status: 401 });
    }

    // Hash the new password
    const hashedPassword = await bcrypt.hash(newPassword, 12);

    // Update password
    await prisma.systemSettings.update({
      where: { id: 'default' },
      data: { adminPassword: hashedPassword }
    });

    return NextResponse.json({ success: true, message: 'Password berhasil diubah! Gunakan password baru untuk login berikutnya.' });
  } catch (error) {
    console.error('Failed to change password:', error);
    return NextResponse.json({ error: 'Terjadi kesalahan sistem' }, { status: 500 });
  }
}
