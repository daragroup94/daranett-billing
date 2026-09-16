'use client';

import { useState, useEffect, useRef } from 'react';
import { 
  Database, 
  Download, 
  Shield, 
  HardDrive, 
  Info, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  UploadCloud,
  Trash2,
  RotateCcw,
  Clock,
  FileText
} from 'lucide-react';

interface BackupItem {
  filename: string;
  size: number;
  createdAt: string;
  appName?: string;
  summary?: {
    packages?: number;
    customers?: number;
    invoices?: number;
    logs?: number;
  };
}

export default function BackupPage() {
  const [backups, setBackups] = useState<BackupItem[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(true);
  const [backupLoading, setBackupLoading] = useState(false);
  const [restoreLoading, setRestoreLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [statusAlert, setStatusAlert] = useState<{
    type: 'success' | 'error';
    message: string;
    stats?: any;
  } | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBackups = async () => {
    setLoadingBackups(true);
    try {
      const res = await fetch('/api/backup');
      const data = await res.json();
      if (data.success && Array.isArray(data.backups)) {
        setBackups(data.backups);
      }
    } catch (err) {
      console.error('Failed to load backups:', err);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    fetchBackups();
  }, []);

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (isoString: string) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleString('id-ID', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoString;
    }
  };

  // Buat & download backup baru
  const handleCreateBackup = async () => {
    setBackupLoading(true);
    setStatusAlert(null);
    try {
      const res = await fetch('/api/backup', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal membuat backup');

      setStatusAlert({
        type: 'success',
        message: `Backup berhasil dibuat: ${data.filename}. File otomatis diunduh ke komputer Anda.`,
        stats: data.summary,
      });

      // Otomatis download file
      if (data.downloadUrl) {
        const link = document.createElement('a');
        link.href = data.downloadUrl;
        link.download = data.filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      }

      await fetchBackups();
    } catch (err: any) {
      setStatusAlert({
        type: 'error',
        message: err.message || 'Terjadi kesalahan saat membuat backup.',
      });
    } finally {
      setBackupLoading(false);
    }
  };

  // Download backup dari daftar
  const handleDownloadBackup = (filename: string) => {
    const link = document.createElement('a');
    link.href = `/api/backup?download=${encodeURIComponent(filename)}`;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Hapus backup dari daftar
  const handleDeleteBackup = async (filename: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus file backup "${filename}" dari server?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/backup?file=${encodeURIComponent(filename)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal menghapus backup');

      setStatusAlert({
        type: 'success',
        message: data.message || `File backup "${filename}" berhasil dihapus.`,
      });
      await fetchBackups();
    } catch (err: any) {
      setStatusAlert({
        type: 'error',
        message: err.message || 'Gagal menghapus backup.',
      });
    }
  };

  // Restore dari backup di server
  const handleRestoreServer = async (filename: string) => {
    const confirmed = confirm(
      `PERINGATAN: Memulihkan database dari "${filename}" akan memperbarui data pelanggan, paket, dan tagihan sesuai isi file backup tersebut.\n\nApakah Anda yakin ingin melanjutkan?`
    );
    if (!confirmed) return;

    setRestoreLoading(true);
    setStatusAlert(null);
    try {
      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal memulihkan database.');

      setStatusAlert({
        type: 'success',
        message: data.message || 'Database berhasil dipulihkan!',
        stats: data.stats,
      });
    } catch (err: any) {
      setStatusAlert({
        type: 'error',
        message: err.message || 'Gagal memulihkan database.',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  // Restore dari upload file manual
  const handleRestoreUploadedFile = async () => {
    if (!selectedFile) {
      window.alert('Pilih file backup (.json) terlebih dahulu.');
      return;
    }

    const confirmed = confirm(
      `PERINGATAN: Memulihkan database dari file "${selectedFile.name}" akan memperbarui data pelanggan, paket, dan tagihan di database.\n\nApakah Anda yakin ingin melanjutkan?`
    );
    if (!confirmed) return;

    setRestoreLoading(true);
    setStatusAlert(null);
    try {
      const formData = new FormData();
      formData.append('file', selectedFile);

      const res = await fetch('/api/backup/restore', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal me-restore dari file yang diunggah.');

      setStatusAlert({
        type: 'success',
        message: data.message || 'Database berhasil dipulihkan dari file unggahan!',
        stats: data.stats,
      });

      // Reset file input
      setSelectedFile(null);
      if (fileInputRef.current) fileInputRef.current.value = '';
      await fetchBackups();
    } catch (err: any) {
      setStatusAlert({
        type: 'error',
        message: err.message || 'Gagal me-restore database.',
      });
    } finally {
      setRestoreLoading(false);
    }
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Backup & Restore Database</h1>
          <p>Cadangkan, unduh, dan pulihkan data pelanggan, paket, dan tagihan DaraNet.</p>
        </div>
        <div className="header-actions">
          <div style={{ 
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.5rem 1rem', borderRadius: 'var(--radius-sm)',
            background: 'color-mix(in srgb, var(--accent-teal) 8%, transparent)', 
            border: '1px solid color-mix(in srgb, var(--accent-teal) 20%, transparent)',
            fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '500'
          }}>
            <Shield size={16} /> Database Terproteksi
          </div>
        </div>
      </header>

      {/* Alert Notifikasi Status */}
      {statusAlert && (
        <section style={{ 
          display: 'flex', alignItems: 'flex-start', gap: '0.75rem', 
          padding: '1rem 1.25rem', borderRadius: 'var(--radius-md)',
          background: statusAlert.type === 'success' 
            ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' 
            : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
          border: `1px solid ${statusAlert.type === 'success' 
            ? 'color-mix(in srgb, var(--accent-teal) 30%, transparent)' 
            : 'color-mix(in srgb, var(--accent-rose) 30%, transparent)'}`,
          color: statusAlert.type === 'success' ? 'var(--accent-teal)' : 'var(--accent-rose)', 
          fontSize: '0.85rem', lineHeight: 1.5,
          marginBottom: '1rem'
        }}>
          {statusAlert.type === 'success' ? (
            <CheckCircle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          ) : (
            <AlertTriangle size={20} style={{ flexShrink: 0, marginTop: '2px' }} />
          )}
          <div style={{ flex: 1 }}>
            <strong style={{ display: 'block', fontSize: '0.9rem', marginBottom: '0.2rem' }}>
              {statusAlert.type === 'success' ? 'Operasi Berhasil' : 'Operasi Gagal'}
            </strong>
            <span>{statusAlert.message}</span>
            {statusAlert.stats && (
              <div style={{ marginTop: '0.5rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', opacity: 0.9 }}>
                {statusAlert.stats.packages !== undefined && <span>📦 Paket: {statusAlert.stats.packages}</span>}
                {statusAlert.stats.customers !== undefined && <span>👥 Pelanggan: {statusAlert.stats.customers}</span>}
                {statusAlert.stats.invoices !== undefined && <span>🧾 Tagihan: {statusAlert.stats.invoices}</span>}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Card 1: Buat Backup Baru & Download Langsung */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Download size={20} style={{ color: 'var(--accent-cyan)' }} /> Buat & Unduh Backup Baru
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.75rem 0 0.25rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Buat snapshot lengkap database saat ini yang mencakup seluruh <strong>data pelanggan, paket internet, tagihan invoice, dan pengaturan sistem</strong>.
            File backup akan langsung diunduh ke komputer Anda dan salinannya disimpan di server.
          </p>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
            <button 
              onClick={handleCreateBackup} 
              className="btn btn-primary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', padding: '0.65rem 1.25rem' }}
              disabled={backupLoading || restoreLoading}
            >
              {backupLoading ? <RefreshCw className="animate-spin" size={16} /> : <Database size={16} />} 
              {backupLoading ? 'Sedang Mengekspor & Mengunduh...' : 'Buat & Unduh Backup Sekarang'}
            </button>

            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Format file: <code>.json</code> terenkapsulasi siap simpan & siap restore.
            </span>
          </div>
        </div>
      </section>

      {/* Card 2: Riwayat File Backup di Server */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Clock size={20} style={{ color: 'var(--accent-teal)' }} /> Riwayat File Backup di Server
          </h2>
          <button 
            onClick={fetchBackups} 
            className="btn btn-ghost"
            style={{ fontSize: '0.8rem', padding: '0.35rem 0.65rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
            disabled={loadingBackups}
            title="Muat ulang daftar backup"
          >
            <RefreshCw size={13} className={loadingBackups ? 'animate-spin' : ''} /> Segarkan
          </button>
        </div>

        <div style={{ padding: '0.5rem 0 0 0' }}>
          {loadingBackups ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <RefreshCw className="animate-spin" size={18} style={{ margin: '0 auto 0.5rem' }} />
              Memuat riwayat backup...
            </div>
          ) : backups.length === 0 ? (
            <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
              <FileText size={28} style={{ margin: '0 auto 0.5rem', opacity: 0.4 }} />
              Belum ada file backup yang tersimpan di server. Klik <strong>Buat & Unduh Backup Sekarang</strong> di atas untuk membuat backup pertama Anda.
            </div>
          ) : (
            <div className="table-container" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-secondary)', textAlign: 'left' }}>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Nama File</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Waktu Dibuat</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Isi Ringkasan</th>
                    <th style={{ padding: '0.6rem 0.8rem' }}>Ukuran</th>
                    <th style={{ padding: '0.6rem 0.8rem', textAlign: 'right' }}>Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {backups.map((item) => (
                    <tr key={item.filename} style={{ borderBottom: '1px solid color-mix(in srgb, var(--border-color) 60%, transparent)' }}>
                      <td style={{ padding: '0.65rem 0.8rem', fontWeight: '600', color: 'var(--text-heading)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <FileText size={15} style={{ color: 'var(--accent-cyan)' }} />
                          <span>{item.filename}</span>
                        </div>
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatDate(item.createdAt)}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem' }}>
                        {item.summary ? (
                          <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(6,182,212,0.1)', color: 'var(--accent-cyan)' }}>
                              {item.summary.customers ?? 0} Pelanggan
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(16,185,129,0.1)', color: 'var(--accent-teal)' }}>
                              {item.summary.invoices ?? 0} Tagihan
                            </span>
                            <span style={{ fontSize: '0.75rem', padding: '1px 6px', borderRadius: '4px', background: 'rgba(168,85,247,0.1)', color: 'var(--accent-purple)' }}>
                              {item.summary.packages ?? 0} Paket
                            </span>
                          </div>
                        ) : (
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>File SQL / Legacy</span>
                        )}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                        {formatFileSize(item.size)}
                      </td>
                      <td style={{ padding: '0.65rem 0.8rem', textAlign: 'right' }}>
                        <div style={{ display: 'inline-flex', gap: '0.4rem', justifyContent: 'flex-end' }}>
                          {/* Tombol Unduh */}
                          <button
                            onClick={() => handleDownloadBackup(item.filename)}
                            className="btn btn-secondary"
                            style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', gap: '4px' }}
                            title="Unduh file backup ini"
                          >
                            <Download size={13} /> Unduh
                          </button>

                          {/* Tombol Restore */}
                          {item.filename.endsWith('.json') && (
                            <button
                              onClick={() => handleRestoreServer(item.filename)}
                              className="btn btn-secondary"
                              style={{ 
                                padding: '0.35rem 0.6rem', fontSize: '0.75rem', 
                                display: 'inline-flex', alignItems: 'center', gap: '4px',
                                color: 'var(--accent-amber)',
                                borderColor: 'color-mix(in srgb, var(--accent-amber) 30%, transparent)'
                              }}
                              disabled={restoreLoading}
                              title="Pulihkan database dari file backup ini"
                            >
                              <RotateCcw size={13} /> Restore
                            </button>
                          )}

                          {/* Tombol Hapus */}
                          <button
                            onClick={() => handleDeleteBackup(item.filename)}
                            className="btn btn-ghost"
                            style={{ padding: '0.35rem 0.5rem', color: 'var(--accent-rose)' }}
                            title="Hapus file backup"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>

      {/* Card 3: Restore Database dari File Unggahan */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <UploadCloud size={20} style={{ color: 'var(--accent-purple)' }} /> Restore Database dari File
          </h2>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.75rem 0 0.25rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
            Jika Anda memiliki file backup <code>.json</code> dari server lain atau komputer lokal, Anda dapat mengunggahnya 
            di sini untuk memulihkan seluruh data pelanggan, paket, dan tagihan secara otomatis.
          </p>

          <div style={{ 
            border: '2px dashed var(--border-color)', 
            borderRadius: 'var(--radius-md)', 
            padding: '1.5rem', 
            textAlign: 'center',
            background: 'color-mix(in srgb, var(--border-color) 12%, transparent)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem'
          }}>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json"
              id="backup-file-upload"
              style={{ display: 'none' }}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  setSelectedFile(e.target.files[0]);
                }
              }}
            />

            <UploadCloud size={32} style={{ color: 'var(--accent-purple)', opacity: 0.8 }} />

            <div>
              <label 
                htmlFor="backup-file-upload" 
                className="btn btn-secondary"
                style={{ cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px' }}
              >
                Pilih File Backup (.json)
              </label>
              {selectedFile ? (
                <div style={{ marginTop: '0.5rem', fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '600' }}>
                  File dipilih: {selectedFile.name} ({formatFileSize(selectedFile.size)})
                </div>
              ) : (
                <p style={{ margin: '0.5rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                  Hanya mendukung file format .json hasil export sistem DaraNet
                </p>
              )}
            </div>

            {selectedFile && (
              <button
                onClick={handleRestoreUploadedFile}
                className="btn btn-primary"
                style={{ 
                  marginTop: '0.5rem',
                  display: 'inline-flex', 
                  alignItems: 'center', 
                  gap: '6px',
                  background: 'var(--accent-purple)',
                  borderColor: 'var(--accent-purple)'
                }}
                disabled={restoreLoading}
              >
                {restoreLoading ? <RefreshCw className="animate-spin" size={16} /> : <RotateCcw size={16} />}
                {restoreLoading ? 'Sedang Memulihkan Data...' : 'Mulai Restore Data Sekarang'}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* Card 4: Informasi & Tips Pemeliharaan */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <HardDrive size={20} style={{ color: 'var(--accent-teal)' }} /> Informasi Database & CLI Manual
          </h2>
        </div>

        <div className="list-group">
          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Database Engine</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>PostgreSQL 16 Alpine (Container: daranett-db)</span>
            </div>
            <span style={{ fontSize: '0.85rem', color: 'var(--accent-teal)', fontWeight: '600' }}>Aktif</span>
          </div>

          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Perintah Backup Manual via CLI (Host Server)</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Ekspor full SQL dump langsung dari terminal Linux</span>
            </div>
            <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
              docker exec -t daranett-db pg_dump -U daranett daranett_billing &gt; backup.sql
            </code>
          </div>

          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>Perintah Restore Manual via CLI (Host Server)</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Impor file .sql ke database PostgreSQL baru</span>
            </div>
            <code style={{ fontSize: '0.75rem', background: 'rgba(0,0,0,0.3)', padding: '4px 8px', borderRadius: '4px' }}>
              docker exec -i daranett-db psql -U daranett daranett_billing &lt; backup.sql
            </code>
          </div>
        </div>
      </section>
    </>
  );
}

