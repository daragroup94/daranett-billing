'use client';

import { useState } from 'react';
import { 
  Database, 
  Download, 
  Shield, 
  HardDrive, 
  Info, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle 
} from 'lucide-react';

export default function BackupPage() {
  const [backupLoading, setBackupLoading] = useState(false);
  const [backupResult, setBackupResult] = useState(null);

  const handleBackup = async () => {
    setBackupLoading(true);
    setBackupResult(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat backup database');
      setBackupResult({ success: true, message: data.message || 'Backup database berhasil dibuat!' });
    } catch (err) {
      setBackupResult({ success: false, message: err.message });
    } finally {
      setBackupLoading(false);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Backup Database</h1>
          <p>Kelola backup dan pemeliharaan database PostgreSQL.</p>
        </div>
        <div className="header-actions">
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--accent-teal) 8%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-teal) 20%, transparent)',
            fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '500'
          }}>
            <Shield size={16} /> Database Terproteksi
          </div>
        </div>
      </header>

      {/* Warning Panel */}
      <section style={{ 
        display: 'flex', alignItems: 'flex-start', gap: '0.75rem', 
        padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
        background: 'color-mix(in srgb, var(--accent-amber) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-amber) 20%, transparent)',
        fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
        marginBottom: '0'
      }}>
        <AlertTriangle size={20} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
        <span>
          <strong style={{ color: 'var(--accent-amber)' }}>Penting:</strong> Backup database secara rutin sangat penting untuk melindungi data pelanggan, tagihan, dan konfigurasi sistem Anda. 
          Pastikan untuk menyimpan salinan backup di lokasi yang aman dan terpisah dari server utama.
        </span>
      </section>

      {/* Backup Manual */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} style={{ color: 'var(--accent-cyan)' }} /> Backup Manual
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Buat backup database PostgreSQL secara manual. Proses ini akan membuat salinan lengkap dari seluruh data 
            termasuk data pelanggan, paket, tagihan, pengaturan, dan konfigurasi sistem. File backup dapat digunakan 
            untuk memulihkan data jika terjadi kerusakan atau kehilangan data.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={handleBackup} 
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              disabled={backupLoading}
            >
              {backupLoading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />} 
              {backupLoading ? 'Membuat Backup...' : 'Buat Backup Sekarang'}
            </button>
          </div>

          {backupResult && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              background: backupResult.success ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
              border: `1px solid ${backupResult.success ? 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
              color: backupResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)', 
              fontSize: '0.85rem', fontWeight: '500'
            }}>
              {backupResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
              {backupResult.message}
            </div>
          )}
        </div>
      </section>

      {/* Informasi Database */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={20} style={{ color: 'var(--accent-teal)' }} /> Informasi Database
          </h2>
        </div>

        <div className="list-group">
          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Database Engine</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sistem manajemen database utama</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '600' }}>PostgreSQL</span>
          </div>

          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Connection</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Konfigurasi koneksi database</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Configured via DATABASE_URL</span>
          </div>

          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>ORM</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Object-Relational Mapping layer</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>Prisma Client</span>
          </div>
        </div>
      </section>

      {/* Tips Pemeliharaan */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} style={{ color: 'var(--accent-purple)' }} /> Tips Pemeliharaan
          </h2>
        </div>

        <div className="list-group">
          <div className="list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-teal)',
                boxShadow: '0 0 8px var(--accent-teal)', flexShrink: 0
              }}></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Backup Rutin Setiap Minggu</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Jadwalkan backup otomatis atau lakukan backup manual minimal seminggu sekali untuk mencegah kehilangan data</span>
              </div>
            </div>
            <Database size={18} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
          </div>

          <div className="list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-cyan)',
                boxShadow: '0 0 8px var(--accent-cyan)', flexShrink: 0
              }}></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Monitor Disk Usage</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Pantau penggunaan disk secara berkala untuk memastikan ruang penyimpanan mencukupi bagi database dan file backup</span>
              </div>
            </div>
            <HardDrive size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          </div>

          <div className="list-item">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{ 
                width: '10px', height: '10px', borderRadius: '50%', background: 'var(--accent-purple)',
                boxShadow: '0 0 8px var(--accent-purple)', flexShrink: 0
              }}></div>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Update Dependencies Secara Berkala</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Perbarui Prisma, Next.js, dan dependencies lainnya secara berkala untuk mendapatkan perbaikan keamanan dan fitur terbaru</span>
              </div>
            </div>
            <RefreshCw size={18} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
          </div>
        </div>

        <div style={{ 
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem', 
          padding: '1rem', borderRadius: 'var(--radius-sm)',
          background: 'color-mix(in srgb, var(--accent-amber) 6%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-amber) 15%, transparent)',
          fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
          marginTop: '0.5rem'
        }}>
          <Info size={18} style={{ color: 'var(--accent-amber)', flexShrink: 0, marginTop: '2px' }} />
          <span>
            <strong style={{ color: 'var(--accent-amber)' }}>Catatan:</strong> Untuk backup otomatis terjadwal, Anda dapat menggunakan 
            cron job di server atau layanan scheduler eksternal yang memanggil endpoint backup API secara berkala.
          </span>
        </div>
      </section>
    </>
  );
}
