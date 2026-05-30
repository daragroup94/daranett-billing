'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wifi, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  XCircle, 
  ArrowUpRight,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    graceCustomers: 0,
    totalPackages: 0,
    projectedRevenue: 0,
    collectedThisMonth: 0,
    unpaidThisMonth: 0,
    unpaidCount: 0,
    paidCount: 0
  });
  
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [telegramSettings, setTelegramSettings] = useState({
    telegramBotToken: '',
    telegramChatId: ''
  });
  const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
  const [sendTelegramLoading, setSendTelegramLoading] = useState(false);

  const fetchTelegramSettings = async () => {
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setTelegramSettings({
          telegramBotToken: data.telegramBotToken || '',
          telegramChatId: data.telegramChatId || ''
        });
      }
    } catch (err) {
      console.error('Failed to load Telegram settings:', err);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveSettingsLoading(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramSettings)
      });
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan');
      alert('Pengaturan Telegram berhasil disimpan!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveSettingsLoading(false);
    }
  };

  const handleSendTelegram = async () => {
    setSendTelegramLoading(true);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim telegram');
      alert(data.message || 'Laporan tunggakan berhasil dikirim ke Telegram!');
    } catch (err) {
      alert(err.message);
    } finally {
      setSendTelegramLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    fetchTelegramSettings();
    try {
      setLoading(true);
      setError(null);

      // Fetch customers, packages, and invoices
      const [resCustomers, resPackages, resInvoices] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/packages'),
        fetch('/api/billing')
      ]);

      if (!resCustomers.ok || !resPackages.ok || !resInvoices.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const customers = await resCustomers.json();
      const packages = await resPackages.json();
      const invoices = await resInvoices.json();

      // Calculate stats
      const totalCustomers = customers.length;
      const activeCustomers = customers.filter(c => c.status === 'ACTIVE').length;
      const suspendedCustomers = customers.filter(c => c.status === 'SUSPENDED').length;
      const graceCustomers = customers.filter(c => c.status === 'GRACE_PERIOD').length;
      const totalPackages = packages.length;

      // Projected monthly revenue
      const projectedRevenue = customers.reduce((sum, c) => {
        if (c.status === 'ACTIVE' || c.status === 'GRACE_PERIOD') {
          return sum + ((c.package?.price || 0) - (c.discount || 0));
        }
        return sum;
      }, 0);

      // Current month invoices (e.g. 2026-05)
      const currentYearMonth = new Date().toISOString().substring(0, 7); // "YYYY-MM"
      const currentMonthInvoices = invoices.filter(inv => inv.month === currentYearMonth);
      
      const collectedThisMonth = currentMonthInvoices
        .filter(inv => inv.status === 'PAID')
        .reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidThisMonth = currentMonthInvoices
        .filter(inv => inv.status === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidCount = currentMonthInvoices.filter(inv => inv.status === 'UNPAID').length;
      const paidCount = currentMonthInvoices.filter(inv => inv.status === 'PAID').length;

      setStats({
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        graceCustomers,
        totalPackages,
        projectedRevenue,
        collectedThisMonth,
        unpaidThisMonth,
        unpaidCount,
        paidCount
      });

      // Set recent 5 invoices
      setRecentInvoices(invoices.slice(0, 5));
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard. Pastikan database dan server sudah aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat data dashboard DaraNet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <AlertTriangle size={64} style={{ color: 'var(--accent-rose)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Terjadi Kesalahan</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          <RefreshCw size={18} /> Coba Lagi
        </button>
      </div>
    );
  }

  // Calculate percentage of paid invoices for custom visual ring
  const totalInvoicesCount = stats.paidCount + stats.unpaidCount;
  const collectionPercentage = totalInvoicesCount > 0 ? Math.round((stats.paidCount / totalInvoicesCount) * 100) : 0;

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Dashboard Utama</h1>
          <p>Selamat siang! Kelola operasional RTRW Net DaraNet Anda hari ini.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchDashboardData} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={18} /> Refresh
          </button>
          <Link href="/customers/new" className="btn btn-primary">
            + Tambah Pelanggan
          </Link>
        </div>
      </header>

      {/* Statistics Cards */}
      <section className="dashboard-grid">
        <div className="stat-card cyan">
          <div className="stat-header">
            <span>Total Pelanggan</span>
            <div className="stat-icon"><Users size={20} /></div>
          </div>
          <div className="stat-value">{stats.totalCustomers}</div>
          <div className="stat-desc">
            <span style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>{stats.activeCustomers} Aktif</span>
            {' '}&bull;{' '}
            <span style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>{stats.suspendedCustomers} Isolir</span>
          </div>
        </div>

        <div className="stat-card teal">
          <div className="stat-header">
            <span>Omset Bulanan (Estimasi)</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(stats.projectedRevenue)}</div>
          <div className="stat-desc">Estimasi dari pelanggan aktif</div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <span>Lunas Bulan Ini</span>
            <div className="stat-icon"><CheckCircle size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(stats.collectedThisMonth)}</div>
          <div className="stat-desc">{stats.paidCount} tagihan lunas terbayar</div>
        </div>

        <div className="stat-card rose">
          <div className="stat-header">
            <span>Belum Bayar Bulan Ini</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(stats.unpaidThisMonth)}</div>
          <div className="stat-desc">{stats.unpaidCount} pelanggan belum bayar</div>
        </div>
      </section>

      {/* Row with Custom SVG Chart & Recent Activity */}
      <section className="content-row">
        {/* Collection Performance Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Statistik Penagihan Bulan Ini</h2>
          </div>
          
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem', alignItems: 'center', justifyContent: 'space-around', padding: '1rem 0' }}>
            {/* Custom SVG Ring Chart */}
            <div style={{ position: 'relative', width: '180px', height: '180px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <svg width="180" height="180" viewBox="0 0 180 180" className="chart-svg">
                {/* Background Ring */}
                <circle 
                  cx="90" 
                  cy="90" 
                  r="75" 
                  stroke="rgba(255,255,255,0.05)" 
                  strokeWidth="15" 
                  fill="transparent" 
                />
                {/* Accent Teal Ring for Paid */}
                <circle 
                  cx="90" 
                  cy="90" 
                  r="75" 
                  stroke="var(--accent-teal)" 
                  strokeWidth="15" 
                  fill="transparent" 
                  strokeDasharray={`${2 * Math.PI * 75}`}
                  strokeDashoffset={`${2 * Math.PI * 75 * (1 - collectionPercentage / 100)}`}
                  strokeLinecap="round"
                  transform="rotate(-90 90 90)"
                  style={{ transition: 'stroke-dashoffset 1s ease-in-out' }}
                />
              </svg>
              <div style={{ position: 'absolute', textAlign: 'center' }}>
                <span style={{ fontSize: '2rem', fontWeight: '800', display: 'block', lineHeight: 1 }}>{collectionPercentage}%</span>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Kolektibilitas</span>
              </div>
            </div>

            {/* Legend & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', flex: 1, minWidth: '200px' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-teal)', display: 'inline-block' }}></span>
                    Sudah Terbayar ({stats.paidCount})
                  </span>
                  <span style={{ fontWeight: '600' }}>{formatRupiah(stats.collectedThisMonth)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${collectionPercentage}%`, height: '100%', background: 'var(--accent-teal)' }}></div>
                </div>
              </div>

              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.25rem', fontSize: '0.9rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--accent-rose)', display: 'inline-block' }}></span>
                    Belum Terbayar ({stats.unpaidCount})
                  </span>
                  <span style={{ fontWeight: '600' }}>{formatRupiah(stats.unpaidThisMonth)}</span>
                </div>
                <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '3px', overflow: 'hidden' }}>
                  <div style={{ width: `${100 - collectionPercentage}%`, height: '100%', background: 'var(--accent-rose)' }}></div>
                </div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.02)', padding: '0.85rem', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-color)', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Target penagihan bulan ini adalah <strong>{formatRupiah(stats.collectedThisMonth + stats.unpaidThisMonth)}</strong> dari total <strong>{totalInvoicesCount}</strong> tagihan yang diterbitkan.
              </div>
            </div>
          </div>
        </div>

        {/* Quick Links / Shortcuts Panel */}
        <div className="panel-card">
          <div className="panel-header">
            <h2 className="panel-title">Tautan Cepat</h2>
          </div>
          <div className="list-group">
            <Link href="/billing" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Tagih Pelanggan</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Generate & kirim invoice bulanan</span>
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--accent-cyan)' }} />
            </Link>

            <Link href="/customers" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Isolir Pelanggan</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Matikan koneksi pelanggan menunggak</span>
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--accent-cyan)' }} />
            </Link>

            <Link href="/packages" className="list-item" style={{ textDecoration: 'none', color: 'inherit' }}>
              <div>
                <strong style={{ display: 'block', fontSize: '0.95rem' }}>Paket Bandwidth</strong>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Atur paket kecepatan 10-100 Mbps</span>
              </div>
              <ArrowUpRight size={18} style={{ color: 'var(--accent-cyan)' }} />
            </Link>
          </div>
        </div>
      </section>

      {/* Recent Payments & Invoices */}
      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title">Tagihan & Aktivitas Terbaru</h2>
          <Link href="/billing" style={{ fontSize: '0.85rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: '600' }}>
            Lihat Semua Tagihan
          </Link>
        </div>

        <div className="table-container">
          {recentInvoices.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Belum ada data tagihan.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Pelanggan</th>
                  <th>Bulan</th>
                  <th>Paket</th>
                  <th>Jumlah Tagihan</th>
                  <th>Status</th>
                  <th>Metode</th>
                </tr>
              </thead>
              <tbody>
                {recentInvoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/customers/${inv.customer.id}`} style={{ color: '#fff', fontWeight: '600', textDecoration: 'none' }}>
                        {inv.customer.name}
                      </Link>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                        {inv.customer.phone}
                      </span>
                    </td>
                    <td>{inv.month}</td>
                    <td>{inv.customer.package?.name || '-'}</td>
                    <td style={{ fontWeight: '600' }}>
                      {formatRupiah(inv.amount - (inv.discount || 0))}
                      {inv.discount > 0 && (
                        <span style={{ display: 'block', fontSize: '0.7rem', color: 'var(--accent-rose)', fontWeight: 'normal' }}>
                          (Disc: -{formatRupiah(inv.discount)})
                        </span>
                      )}
                    </td>
                    <td>
                      <span className={`badge ${inv.status === 'PAID' ? 'badge-active' : 'badge-suspended'}`}>
                        {inv.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                      </span>
                    </td>
                    <td>
                      {inv.status === 'PAID' ? (
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '500' }}>
                          {inv.paymentMethod || 'CASH'}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Telegram Configuration Settings Panel */}
      <section className="panel-card" style={{ marginTop: '2rem' }}>
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: '#0ea5e9' }}>⚙️</span> Integrasi Telegram Bot (Laporan Tunggakan)
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Masukkan Kredensial Telegram Bot Anda agar sistem dapat mengirimkan daftar pelanggan yang menunggak secara otomatis (harian) atau manual ke chat grup/pribadi Telegram Anda.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Telegram Bot Token</label>
              <input 
                type="text" 
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" 
                value={telegramSettings.telegramBotToken} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Token Bot Telegram yang diperoleh dari <strong>@BotFather</strong>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Telegram Chat ID / Group ID</label>
              <input 
                type="text" 
                placeholder="-1001234567890 atau 12345678" 
                value={telegramSettings.telegramChatId} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Chat ID tujuan laporan (bisa ID grup atau ID pribadi. Dapatkan via <strong>@userinfobot</strong>).
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={handleSendTelegram}
              disabled={sendTelegramLoading || !telegramSettings.telegramBotToken || !telegramSettings.telegramChatId}
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'rgba(14, 165, 233, 0.1)', color: '#0ea5e9', border: '1px solid rgba(14, 165, 233, 0.2)' }}
            >
              {sendTelegramLoading ? <RefreshCw className="animate-spin" size={16} /> : '⚡'} Kirim Laporan Sekarang
            </button>
            
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={saveSettingsLoading}>
              {saveSettingsLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Kredensial
            </button>
          </div>
        </form>
      </section>
    </>
  );
}
