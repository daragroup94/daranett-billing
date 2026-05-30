'use client';

import { useState, useEffect } from 'react';
import { Wifi, Plus, Trash2, Edit3, Save, X, RefreshCw, Info } from 'lucide-react';

export default function PackagesPage() {
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Form States
  const [form, setForm] = useState({
    id: '',
    name: '',
    speedUpload: '',
    speedDownload: '',
    price: '',
    description: ''
  });
  const [isEditing, setIsEditing] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [actionError, setActionError] = useState(null);

  const fetchPackages = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch('/api/packages');
      if (!res.ok) throw new Error('Gagal mengambil data paket');
      const data = await res.json();
      setPackages(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPackages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleEdit = (pkg) => {
    setForm({
      id: pkg.id,
      name: pkg.name,
      speedUpload: pkg.speedUpload.toString(),
      speedDownload: pkg.speedDownload.toString(),
      price: pkg.price.toString(),
      description: pkg.description || ''
    });
    setIsEditing(true);
    setShowForm(true);
    setActionError(null);
  };

  const handleCancel = () => {
    setForm({ id: '', name: '', speedUpload: '', speedDownload: '', price: '', description: '' });
    setIsEditing(false);
    setShowForm(false);
    setActionError(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setActionError(null);

    if (!form.name || !form.speedUpload || !form.speedDownload || !form.price) {
      setActionError('Mohon isi semua kolom yang bertanda *');
      return;
    }

    try {
      const url = isEditing ? `/api/packages/${form.id}` : '/api/packages';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await res.json();
      
      if (!res.ok) {
        throw new Error(result.error || 'Terjadi kesalahan sistem');
      }

      handleCancel();
      fetchPackages();
    } catch (err) {
      setActionError(err.message);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus paket internet ini?')) return;

    try {
      const res = await fetch(`/api/packages/${id}`, {
        method: 'DELETE'
      });
      const result = await res.json();

      if (!res.ok) {
        throw new Error(result.error || 'Gagal menghapus paket');
      }

      fetchPackages();
    } catch (err) {
      alert(err.message);
    }
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Paket Kecepatan Internet</h1>
          <p>Kelola profil bandwidth dan harga langganan bulanan DaraNet.</p>
        </div>
        <div className="header-actions">
          {!showForm && (
            <button onClick={() => setShowForm(true)} className="btn btn-primary">
              <Plus size={18} /> Tambah Paket Baru
            </button>
          )}
        </div>
      </header>

      {showForm && (
        <section className="panel-card" style={{ border: '1px solid var(--accent-cyan)', background: 'rgba(14, 165, 233, 0.03)' }}>
          <div className="panel-header">
            <h2 className="panel-title">{isEditing ? 'Edit Paket Internet' : 'Buat Paket Internet Baru'}</h2>
            <button onClick={handleCancel} className="action-btn" title="Batal">
              <X size={20} />
            </button>
          </div>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            {actionError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
                {actionError}
              </div>
            )}

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Paket *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: Dara Hemat 10 Mbps"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Harga Bulanan (Rp) *</label>
                <input 
                  type="number" 
                  name="price" 
                  value={form.price} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: 150000"
                  required
                />
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Upload Speed (Mbps) *</label>
                <input 
                  type="number" 
                  name="speedUpload" 
                  value={form.speedUpload} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="10"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Download Speed (Mbps) *</label>
                <input 
                  type="number" 
                  name="speedDownload" 
                  value={form.speedDownload} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="10"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Keterangan / Deskripsi</label>
              <textarea 
                name="description" 
                value={form.description} 
                onChange={handleInputChange} 
                className="form-textarea" 
                rows="2"
                placeholder="Tuliskan keterangan detail paket..."
              />
            </div>

            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
              <button type="button" onClick={handleCancel} className="btn btn-secondary">
                Batal
              </button>
              <button type="submit" className="btn btn-primary">
                <Save size={18} /> Simpan Paket
              </button>
            </div>
          </form>
        </section>
      )}

      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title">Daftar Paket Internet</h2>
          <button onClick={fetchPackages} className="action-btn" title="Refresh">
            <RefreshCw size={18} />
          </button>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" />
            <p style={{ marginTop: '0.5rem' }}>Memuat paket internet...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: '2rem' }}>Error: {error}</p>
        ) : packages.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
            <Wifi size={48} style={{ opacity: 0.3 }} />
            <p>Belum ada paket internet yang dibuat. Silakan tambahkan paket baru.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Paket</th>
                  <th>Upload</th>
                  <th>Download</th>
                  <th>Harga Bulanan</th>
                  <th>Jumlah Pengguna</th>
                  <th>Keterangan</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {packages.map((pkg) => (
                  <tr key={pkg.id}>
                    <td style={{ fontWeight: '600', color: '#fff' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                        <Wifi size={18} style={{ color: 'var(--accent-cyan)' }} />
                        {pkg.name}
                      </div>
                    </td>
                    <td>{pkg.speedUpload} Mbps</td>
                    <td>{pkg.speedDownload} Mbps</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>{formatRupiah(pkg.price)}</td>
                    <td style={{ fontWeight: '600' }}>
                      <span className="badge badge-active">
                        {pkg._count?.customers || 0} Pelanggan
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>{pkg.description || '-'}</td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <button onClick={() => handleEdit(pkg)} className="action-btn" title="Edit Paket">
                          <Edit3 size={18} />
                        </button>
                        <button onClick={() => handleDelete(pkg.id)} className="action-btn delete" title="Hapus Paket">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {/* Modern info footer card */}
      <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', alignItems: 'flex-start' }}>
        <Info size={20} style={{ color: 'var(--accent-cyan)', marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Petunjuk Manajemen Paket:</strong> Paket internet terintegrasi langsung dengan profil pelanggan. Menghapus paket hanya diperbolehkan jika tidak ada pelanggan aktif yang melanggan paket tersebut. Anda dapat menyesuaikan harga dan bandwidth kapan saja secara real-time.
        </div>
      </div>
    </>
  );
}
