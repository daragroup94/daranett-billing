'use client';

import { useState, useEffect } from 'react';
import { 
  BarChart3, 
  TrendingUp, 
  Download, 
  Calendar, 
  RefreshCw, 
  DollarSign,
  Wallet,
  TrendingDown,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

export default function LaporanPage() {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Default range: 6 months back to current month
  const now = new Date();
  const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 5, 1);
  const defaultFrom = `${sixMonthsAgo.getFullYear()}-${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`;
  const defaultTo = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

  const [fromMonth, setFromMonth] = useState(defaultFrom);
  const [toMonth, setToMonth] = useState(defaultTo);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const fetchLaporan = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/laporan?from=${fromMonth}&to=${toMonth}`);
      if (!res.ok) throw new Error('Gagal memuat data laporan');
      const result = await res.json();
      setData(result);
    } catch (err: any) {
      console.error(err);
      setError('Gagal memuat data laporan. Pastikan server dan database aktif.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLaporan();
  }, []);

  const handleFilter = (e: React.FormEvent) => {
    e.preventDefault();
    fetchLaporan();
  };

  const handleExportCSV = () => {
    if (!data || !data.monthly || data.monthly.length === 0) return;

    const headers = ['Bulan', 'Jumlah Invoice', 'Lunas', 'Belum Bayar', 'Total Pendapatan', 'Pengeluaran Beban', 'Laba Bersih', 'Total Tunggakan'];
    const rows = data.monthly.map((row: any) => [
      row.month,
      row.totalInvoices,
      row.paid,
      row.unpaid,
      row.totalRevenue,
      row.totalExpenses || 0,
      row.netProfit || 0,
      row.totalTunggakan
    ]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `laporan_laba_rugi_${fromMonth}_${toMonth}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat data laporan keuangan &amp; laba rugi...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <BarChart3 size={64} style={{ color: 'var(--accent-rose)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700', marginBottom: '0.5rem' }}>Terjadi Kesalahan</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
        <button onClick={fetchLaporan} className="btn btn-primary">
          <RefreshCw size={18} /> Coba Lagi
        </button>
      </div>
    );
  }

  const summary = data?.summary || { 
    totalRevenue: 0, 
    totalUnpaid: 0, 
    totalExpenses: 0, 
    netProfit: 0, 
    paidCount: 0, 
    unpaidCount: 0 
  };
  const monthly = data?.monthly || [];

  // Find max revenue for bar chart scaling
  const maxRevenue = monthly.length > 0 ? Math.max(...monthly.map((m: any) => m.totalRevenue), 1) : 1;

  // Last 6 months for trend chart
  const trendData = monthly.slice(-6);

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Laporan Keuangan &amp; Laba Rugi</h1>
          <p>Analisis komprehensif pendapatan tagihan, beban pengeluaran, laba bersih riil, dan tunggakan.</p>
        </div>
        <div className="header-actions">
          <button onClick={handleExportCSV} className="btn btn-secondary" disabled={!data || !data.monthly || data.monthly.length === 0}>
            <Download size={18} /> Export CSV
          </button>
          <button onClick={fetchLaporan} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </header>

      {/* Month Range Filter */}
      <section className="panel-card">
        <form onSubmit={handleFilter} style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'flex-end', gap: '1rem' }}>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Dari Bulan
            </label>
            <input 
              type="month" 
              value={fromMonth} 
              onChange={(e) => setFromMonth(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
          <div className="form-group" style={{ flex: 1, minWidth: '180px' }}>
            <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={14} /> Sampai Bulan
            </label>
            <input 
              type="month" 
              value={toMonth} 
              onChange={(e) => setToMonth(e.target.value)}
              className="form-input"
              style={{ width: '100%' }}
            />
          </div>
          <button type="submit" className="btn btn-primary" style={{ height: 'fit-content' }}>
            <BarChart3 size={18} /> Tampilkan Laporan
          </button>
        </form>
      </section>

      {/* Summary Stat Cards */}
      <section className="dashboard-grid">
        {/* Total Pendapatan (Kas Masuk) */}
        <div className="stat-card teal">
          <div className="stat-header">
            <span>Total Pendapatan (Omset)</span>
            <div className="stat-icon"><DollarSign size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--accent-teal)' }}>
            {formatRupiah(summary.totalRevenue)}
          </div>
          <div className="stat-desc">
            Tagihan lunas ({summary.paidCount} invoice)
          </div>
        </div>

        {/* Total Pengeluaran (Kas Keluar) */}
        <div className="stat-card rose">
          <div className="stat-header">
            <span>Total Pengeluaran (Beban)</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
              <ArrowUpRight size={20} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--accent-rose)' }}>
            {formatRupiah(summary.totalExpenses || 0)}
          </div>
          <div className="stat-desc">Beban operasional &amp; infrastruktur</div>
        </div>

        {/* Laba Bersih Riil */}
        <div className={`stat-card ${(summary.netProfit || 0) >= 0 ? 'purple' : 'rose'}`}>
          <div className="stat-header">
            <span>Laba Bersih Riil (Net Profit)</span>
            <div className="stat-icon" style={{ 
              background: (summary.netProfit || 0) >= 0 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)', 
              color: (summary.netProfit || 0) >= 0 ? 'var(--accent-purple)' : 'var(--accent-rose)' 
            }}>
              {(summary.netProfit || 0) >= 0 ? <TrendingUp size={20} /> : <TrendingDown size={20} />}
            </div>
          </div>
          <div className="stat-value" style={{ 
            fontSize: '1.8rem', 
            color: (summary.netProfit || 0) >= 0 ? 'var(--accent-purple)' : 'var(--accent-rose)' 
          }}>
            {formatRupiah(summary.netProfit || 0)}
          </div>
          <div className="stat-desc">
            {(summary.netProfit || 0) >= 0 ? 'Surplus setelah beban operasional' : 'Defisit operasional'}
          </div>
        </div>

        {/* Total Tunggakan */}
        <div className="stat-card cyan">
          <div className="stat-header">
            <span>Total Tagihan Tertunggak</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(summary.totalUnpaid)}</div>
          <div className="stat-desc">
            {summary.unpaidCount} invoice belum terbayar
            {summary.totalCarriedOverDebt > 0 && (
              <span style={{ display: 'block', fontSize: '0.75rem', opacity: 0.85, marginTop: '0.15rem' }}>
                (Termasuk {formatRupiah(summary.totalCarriedOverDebt)} rollover kurang bayar)
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Monthly Breakdown Table */}
      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <BarChart3 size={20} style={{ color: 'var(--accent-cyan)' }} /> Rincian Laba Rugi Per Bulan
          </h2>
        </div>

        <div className="table-container">
          {monthly.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Belum ada data laporan untuk periode ini.</p>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Bulan</th>
                  <th>Jumlah Inv</th>
                  <th>Lunas</th>
                  <th>Tunggak</th>
                  <th>Pendapatan (Kas Masuk)</th>
                  <th>Beban (Kas Keluar)</th>
                  <th>Laba Bersih</th>
                  <th>Tunggakan</th>
                </tr>
              </thead>
              <tbody>
                {monthly.map((row: any) => {
                  const net = row.netProfit ?? (row.totalRevenue - (row.totalExpenses || 0));
                  return (
                    <tr key={row.month}>
                      <td style={{ fontWeight: '600' }}>{row.month}</td>
                      <td>{row.totalInvoices}</td>
                      <td>
                        <span style={{ color: 'var(--accent-teal)', fontWeight: '600' }}>{row.paid}</span>
                      </td>
                      <td>
                        <span style={{ color: 'var(--accent-rose)', fontWeight: '600' }}>{row.unpaid}</span>
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>
                        {formatRupiah(row.totalRevenue)}
                      </td>
                      <td style={{ fontWeight: '600', color: 'var(--accent-rose)' }}>
                        {formatRupiah(row.totalExpenses || 0)}
                      </td>
                      <td style={{ fontWeight: '700', color: net >= 0 ? 'var(--accent-purple)' : 'var(--accent-rose)' }}>
                        {formatRupiah(net)}
                      </td>
                      <td style={{ fontWeight: '600', color: row.totalTunggakan > 0 ? 'var(--accent-rose)' : 'var(--text-secondary)' }}>
                        {formatRupiah(row.totalTunggakan)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </section>

      {/* Revenue Trend Bar Chart */}
      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <TrendingUp size={20} style={{ color: 'var(--accent-teal)' }} /> Trend Pendapatan vs Beban 6 Bulan Terakhir
          </h2>
        </div>

        {trendData.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)' }}>Belum ada data trend untuk ditampilkan.</p>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', padding: '0.5rem 0' }}>
            {trendData.map((row: any) => {
              const widthRevenue = maxRevenue > 0 ? (row.totalRevenue / maxRevenue) * 100 : 0;
              const widthExpense = maxRevenue > 0 ? ((row.totalExpenses || 0) / maxRevenue) * 100 : 0;
              return (
                <div key={row.month} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', fontWeight: 600 }}>
                    <span style={{ color: 'var(--text-primary)' }}>{row.month}</span>
                    <div style={{ display: 'flex', gap: '1rem', fontSize: '0.78rem' }}>
                      <span style={{ color: 'var(--accent-teal)' }}>Pendapatan: {formatRupiah(row.totalRevenue)}</span>
                      <span style={{ color: 'var(--accent-rose)' }}>Beban: {formatRupiah(row.totalExpenses || 0)}</span>
                    </div>
                  </div>

                  {/* Dual Bar (Revenue and Expense) */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
                    <div style={{ width: '100%', background: 'var(--hover-overlay)', borderRadius: 4, height: 14, overflow: 'hidden' }}>
                      <div 
                        style={{ 
                          width: `${Math.max(widthRevenue, 2)}%`, 
                          height: '100%', 
                          background: 'var(--accent-teal)',
                          borderRadius: 4,
                          transition: 'width 0.5s ease'
                        }} 
                        title={`Pendapatan: ${formatRupiah(row.totalRevenue)}`}
                      />
                    </div>
                    {(row.totalExpenses || 0) > 0 && (
                      <div style={{ width: '100%', background: 'var(--hover-overlay)', borderRadius: 4, height: 10, overflow: 'hidden' }}>
                        <div 
                          style={{ 
                            width: `${Math.max(widthExpense, 2)}%`, 
                            height: '100%', 
                            background: 'var(--accent-rose)',
                            borderRadius: 4,
                            transition: 'width 0.5s ease'
                          }} 
                          title={`Beban: ${formatRupiah(row.totalExpenses || 0)}`}
                        />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </>
  );
}
