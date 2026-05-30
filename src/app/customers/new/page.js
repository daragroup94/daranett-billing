'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Save, RefreshCw, AlertTriangle, UserPlus, Info } from 'lucide-react';

export default function NewCustomerPage() {
  const router = useRouter();
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  
  const [form, setForm] = useState({
    name: '',
    phone: '',
    address: '',
    ipAddress: '',
    pppoeUsername: '',
    pppoePassword: '',
    dueDate: '1',
    dueTime: '10:00',
    discount: '0',
    status: 'ACTIVE',
    packageId: '',
    joinDate: new Date().toISOString().substring(0, 10)
  });

  useEffect(() => {
    const fetchPackages = async () => {
      try {
        const res = await fetch('/api/packages');
        if (!res.ok) throw new Error('Gagal memuat daftar paket');
        const data = await res.json();
        setPackages(data);
        if (data.length > 0) {
          setForm(prev => ({ ...prev, packageId: data[0].id }));
        }
      } catch (err) {
        setError('Gagal memuat paket internet. Pastikan Anda telah membuat paket terlebih dahulu.');
      } finally {
        setLoading(false);
      }
    };
    fetchPackages();
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    if (!form.name || !form.phone || !form.address || !form.packageId || !form.dueDate) {
      setError('Mohon isi semua field yang bertanda *');
      setSaving(false);
      return;
    }

    try {
      const res = await fetch('/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      router.push('/customers');
    } catch (err) {
      setError(err.message);
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat data formulir...</p>
      </div>
    );
  }

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link href="/customers" className="action-btn" style={{ background: 'rgba(255,255,255,0.03)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1>Tambah Pelanggan Baru</h1>
          </div>
          <p>Mendaftarkan pelanggan baru pada jaringan RTRW Net DaraNet.</p>
        </div>
      </header>

      <section className="panel-card" style={{ maxWidth: '800px' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '0.5rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <UserPlus size={20} style={{ color: 'var(--accent-cyan)' }} />
            Data Profil Pelanggan
          </h2>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {error && (
            <div style={{ background: 'rgba(244, 63, 94, 0.1)', border: '1px solid var(--accent-rose)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', display: 'flex', alignItems: 'center', gap: '0.75rem', fontSize: '0.9rem' }}>
              <AlertTriangle size={18} />
              <span>{error}</span>
            </div>
          )}

          {/* Section 1: Personal Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-cyan)', fontWeight: '600' }}>Informasi Personal & Alamat</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Nama Lengkap *</label>
                <input 
                  type="text" 
                  name="name" 
                  value={form.name} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: Budi Santoso"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">No. WhatsApp / HP *</label>
                <input 
                  type="text" 
                  name="phone" 
                  value={form.phone} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: 08123456789"
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Alamat Lengkap *</label>
              <textarea 
                name="address" 
                value={form.address} 
                onChange={handleInputChange} 
                className="form-textarea" 
                rows="2"
                placeholder="Contoh: Jl. Merdeka No. 45, RT 02 / RW 05"
                required
              />
            </div>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Aktif / Gabung *</label>
                <input 
                  type="date" 
                  name="joinDate" 
                  value={form.joinDate} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  required
                />
              </div>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)' }} />

          {/* Section 2: Technical Info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-purple)', fontWeight: '600' }}>Detail Teknis Jaringan (Optional)</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Static IP Address</label>
                <input 
                  type="text" 
                  name="ipAddress" 
                  value={form.ipAddress} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: 192.168.88.50"
                />
              </div>

              <div className="form-group">
                <label className="form-label">PPPoE Username</label>
                <input 
                  type="text" 
                  name="pppoeUsername" 
                  value={form.pppoeUsername} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: budi_daranett"
                />
              </div>

              <div className="form-group">
                <label className="form-label">PPPoE Password</label>
                <input 
                  type="password" 
                  name="pppoePassword" 
                  value={form.pppoePassword} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="••••••••"
                />
              </div>
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--border-color)' }} />

          {/* Section 3: Billing & Package */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <h3 style={{ fontSize: '1rem', color: 'var(--accent-teal)', fontWeight: '600' }}>Paket Langganan & Sistem Billing</h3>
            
            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Paket Internet DaraNet *</label>
                {packages.length === 0 ? (
                  <div style={{ color: 'var(--accent-rose)', fontSize: '0.85rem', padding: '0.5rem 0' }}>
                    Belum ada paket internet. Silakan <Link href="/packages" style={{ color: 'var(--accent-cyan)', fontWeight: '600' }}>Buat Paket</Link> terlebih dahulu.
                  </div>
                ) : (
                  <select 
                    name="packageId" 
                    value={form.packageId} 
                    onChange={handleInputChange} 
                    className="form-select"
                    required
                  >
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>
                        {pkg.name} - Rp {pkg.price.toLocaleString('id-ID')} ({pkg.speedDownload}M)
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Status Awal *</label>
                <select 
                  name="status" 
                  value={form.status} 
                  onChange={handleInputChange} 
                  className="form-select"
                  required
                >
                  <option value="ACTIVE">ACTIVE (Aktif)</option>
                  <option value="GRACE_PERIOD">GRACE PERIOD (Masa Tenggang)</option>
                  <option value="SUSPENDED">SUSPENDED (Isolir)</option>
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label">Tanggal Jatuh Tempo Bulanan *</label>
                <select 
                  name="dueDate" 
                  value={form.dueDate} 
                  onChange={handleInputChange} 
                  className="form-select"
                  required
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                    <option key={day} value={day}>Setiap Tanggal {day}</option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Jam Jatuh Tempo (Format 24 Jam) *</label>
                <input 
                  type="time" 
                  name="dueTime" 
                  value={form.dueTime} 
                  onChange={handleInputChange} 
                  className="form-input"
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label">Potongan / Diskon Bulanan (Rp)</label>
                <input 
                  type="number" 
                  name="discount" 
                  value={form.discount} 
                  onChange={handleInputChange} 
                  className="form-input" 
                  placeholder="Contoh: 40000"
                  min="0"
                />
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '1rem' }}>
            <Link href="/customers" className="btn btn-secondary">
              Batal
            </Link>
            <button type="submit" className="btn btn-primary" disabled={saving || packages.length === 0}>
              {saving ? (
                <>
                  <RefreshCw className="animate-spin" size={18} /> Menyimpan...
                </>
              ) : (
                <>
                  <Save size={18} /> Daftarkan Pelanggan
                </>
              )}
            </button>
          </div>
        </form>
      </section>

      <div style={{ display: 'flex', gap: '1rem', background: 'rgba(255,255,255,0.01)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-md)', alignItems: 'flex-start', maxWidth: '800px' }}>
        <Info size={20} style={{ color: 'var(--accent-cyan)', marginTop: '0.1rem' }} />
        <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          <strong>Info Integrasi Mikrotik:</strong> Data teknis seperti <em>Static IP</em> dan <em>PPPoE credentials</em> mempermudah sinkronisasi otomatis ke Router Mikrotik (API RouterOS) di masa depan. Pastikan data terisi dengan format yang benar.
        </div>
      </div>
    </>
  );
}
