'use client';

import { useState, useEffect, useMemo } from 'react';
import { 
  Wallet, 
  Plus, 
  Search, 
  Filter, 
  Calendar, 
  Download, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  CreditCard, 
  ArrowUpRight, 
  ArrowDownRight, 
  Trash2, 
  Edit3, 
  X, 
  CheckCircle, 
  AlertTriangle,
  Server,
  Zap,
  Users,
  Wrench,
  Tag
} from 'lucide-react';

interface ExpenseItem {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  paymentMethod: string | null;
  notes: string | null;
  createdAt: string;
}

const CATEGORY_CONFIG: Record<string, { label: string; color: string; bg: string; icon: any }> = {
  UPSTREAM: { 
    label: 'Bandwidth & Upstream', 
    color: '#06b6d4', 
    bg: 'rgba(6, 182, 212, 0.12)', 
    icon: Server 
  },
  INFRASTRUCTURE: { 
    label: 'Kabel & Infrastruktur', 
    color: '#8b5cf6', 
    bg: 'rgba(139, 92, 246, 0.12)', 
    icon: Wrench 
  },
  SALARY: { 
    label: 'Gaji & Honor Teknisi', 
    color: '#10b981', 
    bg: 'rgba(16, 185, 129, 0.12)', 
    icon: Users 
  },
  UTILITIES: { 
    label: 'Listrik, Server & BTS', 
    color: '#f59e0b', 
    bg: 'rgba(245, 158, 11, 0.12)', 
    icon: Zap 
  },
  MAINTENANCE: { 
    label: 'Perbaikan & Perawatan', 
    color: '#3b82f6', 
    bg: 'rgba(59, 130, 246, 0.12)', 
    icon: Wrench 
  },
  MARKETING: { 
    label: 'Pemasaran & Operasional', 
    color: '#ec4899', 
    bg: 'rgba(236, 72, 153, 0.12)', 
    icon: Tag 
  },
  OTHER: { 
    label: 'Lain-lain', 
    color: '#94a3b8', 
    bg: 'rgba(148, 163, 184, 0.12)', 
    icon: DollarSign 
  },
};

export default function KasPage() {
  const [expenses, setExpenses] = useState<ExpenseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Cashflow summary from API
  const [cashflow, setCashflow] = useState({
    totalIncome: 0,
    totalExpenses: 0,
    netProfit: 0,
    profitMargin: 0
  });

  // Filter States
  const now = new Date();
  const currentMonthStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  const [monthFilter, setMonthFilter] = useState(currentMonthStr);
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [searchTerm, setSearchTerm] = useState('');

  // Modal Form State
  const [showModal, setShowModal] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const [form, setForm] = useState({
    id: '',
    title: '',
    category: 'UPSTREAM',
    amount: '',
    date: new Date().toISOString().substring(0, 10),
    paymentMethod: 'TRANSFER',
    notes: ''
  });

  // Generate Month list for dropdown
  const monthsList = useMemo(() => {
    const list = [];
    for (let i = -6; i <= 2; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() + i, 1);
      list.push(d.toISOString().substring(0, 7));
    }
    return list.reverse();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatDateIndo = (dateStr: string) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

  const getReadableMonth = (monthStr: string) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  // Fetch expenses data
  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const queryParams = new URLSearchParams();
      if (monthFilter) queryParams.append('month', monthFilter);
      if (categoryFilter !== 'ALL') queryParams.append('category', categoryFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

      const res = await fetch(`/api/expenses?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data buku kas');
      const data = await res.json();
      setExpenses(data.expenses || []);
      if (data.cashflow) {
        setCashflow(data.cashflow);
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Terjadi kesalahan sistem');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [monthFilter, categoryFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchData();
  };

  const handleOpenAddModal = () => {
    setForm({
      id: '',
      title: '',
      category: 'UPSTREAM',
      amount: '',
      date: new Date().toISOString().substring(0, 10),
      paymentMethod: 'TRANSFER',
      notes: ''
    });
    setIsEditing(false);
    setFormError(null);
    setShowModal(true);
  };

  const handleOpenEditModal = (item: ExpenseItem) => {
    setForm({
      id: item.id,
      title: item.title,
      category: item.category,
      amount: item.amount.toString(),
      date: new Date(item.date).toISOString().substring(0, 10),
      paymentMethod: item.paymentMethod || 'TRANSFER',
      notes: item.notes || ''
    });
    setIsEditing(true);
    setFormError(null);
    setShowModal(true);
  };

  const handleFormSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!form.title.trim()) {
      setFormError('Nama / judul pengeluaran wajib diisi');
      return;
    }

    const numAmount = parseFloat(form.amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      setFormError('Nominal harus berupa angka valid lebih dari 0');
      return;
    }

    try {
      setSubmitting(true);
      const url = isEditing ? `/api/expenses/${form.id}` : '/api/expenses';
      const method = isEditing ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form)
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Gagal menyimpan transaksi');

      setShowModal(false);
      fetchData();
    } catch (err: any) {
      setFormError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string, amount: number) => {
    if (!confirm(`Hapus pencatatan pengeluaran "${title}" sebesar ${formatRupiah(amount)}?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/expenses/${id}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Gagal menghapus pengeluaran');
      }
      fetchData();
    } catch (err: any) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    if (expenses.length === 0) {
      alert('Tidak ada data pengeluaran untuk diekspor.');
      return;
    }

    const headers = ['Tanggal', 'Judul Pengeluaran', 'Kategori', 'Metode Pembayaran', 'Nominal (IDR)', 'Catatan'];
    const rows = expenses.map(exp => [
      `"${exp.date ? new Date(exp.date).toISOString().substring(0, 10) : ''}"`,
      `"${exp.title.replace(/"/g, '""')}"`,
      `"${CATEGORY_CONFIG[exp.category]?.label || exp.category}"`,
      `"${exp.paymentMethod || 'TRANSFER'}"`,
      exp.amount,
      `"${(exp.notes || '').replace(/"/g, '""')}"`
    ]);

    // Add Summary at bottom of CSV
    rows.push([]);
    rows.push(['"--- RINGKASAN ARUS KAS ---"']);
    rows.push(['"Total Kas Masuk (Tagihan Lunas)"', '', '', '', cashflow.totalIncome]);
    rows.push(['"Total Pengeluaran (Beban)"', '', '', '', cashflow.totalExpenses]);
    rows.push(['"Laba Bersih (Net Profit)"', '', '', '', cashflow.netProfit]);
    rows.push(['"Margin Laba Bersih"', '', '', '', `"${cashflow.profitMargin}%"`]);

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `buku_kas_${monthFilter || 'semua'}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Category breakdown calculations
  const categoryStats = useMemo(() => {
    const stats: Record<string, { count: number; total: number; pct: number }> = {};
    const total = expenses.reduce((s, e) => s + e.amount, 0);

    for (const exp of expenses) {
      if (!stats[exp.category]) {
        stats[exp.category] = { count: 0, total: 0, pct: 0 };
      }
      stats[exp.category].count += 1;
      stats[exp.category].total += exp.amount;
    }

    for (const key of Object.keys(stats)) {
      stats[key].pct = total > 0 ? Math.round((stats[key].total / total) * 100) : 0;
    }

    return stats;
  }, [expenses]);

  return (
    <div className="container" style={{ paddingBottom: '3rem' }}>
      {/* Header */}
      <header className="page-header" style={{ marginBottom: '1.5rem' }}>
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
            <div style={{ 
              width: 36, 
              height: 36, 
              borderRadius: '10px', 
              background: 'linear-gradient(135deg, var(--accent-cyan), #6366f1)',
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center',
              color: '#fff',
              boxShadow: '0 4px 12px rgba(6, 182, 212, 0.25)'
            }}>
              <Wallet size={20} />
            </div>
            <div>
              <h1>Buku Kas &amp; Pengeluaran Operasional</h1>
              <p>Kelola arus kas keluar, beban biaya ISP, dan pantau laba bersih riil DaraNet.</p>
            </div>
          </div>
        </div>

        <div className="header-actions">
          <button 
            onClick={fetchData} 
            className="btn btn-secondary" 
            title="Muat ulang data"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Segarkan
          </button>

          <button 
            onClick={handleExportCSV} 
            className="btn btn-secondary" 
            title="Ekspor laporan ke CSV"
          >
            <Download size={16} /> Ekspor CSV
          </button>

          <button 
            onClick={handleOpenAddModal} 
            className="btn btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
          >
            <Plus size={18} /> Catat Pengeluaran
          </button>
        </div>
      </header>

      {/* Cashflow Summary Cards */}
      <section className="dashboard-grid" style={{ marginBottom: '1.75rem' }}>
        {/* Kas Masuk (Revenue Tagihan) */}
        <div className="stat-card teal">
          <div className="stat-header">
            <span>Kas Masuk (Tagihan Lunas)</span>
            <div className="stat-icon" style={{ background: 'rgba(16, 185, 129, 0.15)', color: 'var(--accent-teal)' }}>
              <ArrowDownRight size={19} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.85rem', color: 'var(--accent-teal)' }}>
            {formatRupiah(cashflow.totalIncome)}
          </div>
          <div className="stat-desc">
            Pendapatan tagihan terbayar periode {getReadableMonth(monthFilter)}
          </div>
        </div>

        {/* Kas Keluar (Pengeluaran Operasional) */}
        <div className="stat-card rose">
          <div className="stat-header">
            <span>Kas Keluar (Beban Operasional)</span>
            <div className="stat-icon" style={{ background: 'rgba(244, 63, 94, 0.15)', color: 'var(--accent-rose)' }}>
              <ArrowUpRight size={19} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.85rem', color: 'var(--accent-rose)' }}>
            {formatRupiah(cashflow.totalExpenses)}
          </div>
          <div className="stat-desc">
            Total {expenses.length} transaksi pengeluaran tercatat
          </div>
        </div>

        {/* Laba Bersih (Net Profit) */}
        <div className={`stat-card ${cashflow.netProfit >= 0 ? 'purple' : 'rose'}`}>
          <div className="stat-header">
            <span>Laba Bersih (Net Profit)</span>
            <div className="stat-icon" style={{ 
              background: cashflow.netProfit >= 0 ? 'rgba(139, 92, 246, 0.15)' : 'rgba(244, 63, 94, 0.15)', 
              color: cashflow.netProfit >= 0 ? 'var(--accent-purple)' : 'var(--accent-rose)' 
            }}>
              {cashflow.netProfit >= 0 ? <TrendingUp size={19} /> : <TrendingDown size={19} />}
            </div>
          </div>
          <div className="stat-value" style={{ 
            fontSize: '1.85rem', 
            color: cashflow.netProfit >= 0 ? 'var(--accent-purple)' : 'var(--accent-rose)' 
          }}>
            {formatRupiah(cashflow.netProfit)}
          </div>
          <div className="stat-desc" style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            {cashflow.netProfit >= 0 ? (
              <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>● Surplus Profit</span>
            ) : (
              <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>● Defisit Operasional</span>
            )}
            <span>(Kas Masuk - Kas Keluar)</span>
          </div>
        </div>

        {/* Margin Profit % */}
        <div className="stat-card cyan">
          <div className="stat-header">
            <span>Margin Keuntungan</span>
            <div className="stat-icon" style={{ background: 'rgba(6, 182, 212, 0.15)', color: 'var(--accent-cyan)' }}>
              <DollarSign size={19} />
            </div>
          </div>
          <div className="stat-value" style={{ fontSize: '2.1rem', color: 'var(--accent-cyan)' }}>
            {cashflow.profitMargin}%
          </div>
          <div className="stat-desc">
            Efisiensi margin laba terhadap pendapatan
          </div>
        </div>
      </section>

      {/* Category Breakdown Chips */}
      {Object.keys(categoryStats).length > 0 && (
        <div className="panel-card" style={{ marginBottom: '1.5rem', padding: '1rem 1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Tag size={15} style={{ color: 'var(--accent-cyan)' }} />
              Distribusi Pengeluaran per Kategori ({getReadableMonth(monthFilter)})
            </span>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Total Beban: <strong>{formatRupiah(cashflow.totalExpenses)}</strong>
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {Object.entries(categoryStats).map(([catKey, stat]) => {
              const cfg = CATEGORY_CONFIG[catKey] || CATEGORY_CONFIG.OTHER;
              const Icon = cfg.icon;
              return (
                <div 
                  key={catKey}
                  style={{
                    background: 'var(--hover-overlay)',
                    border: '1px solid var(--border-color)',
                    borderRadius: 'var(--radius-sm)',
                    padding: '0.65rem 0.85rem',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.35rem'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <div style={{ width: 22, height: 22, borderRadius: 6, background: cfg.bg, color: cfg.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Icon size={12} />
                      </div>
                      <span style={{ fontSize: '0.78rem', fontWeight: 600, color: 'var(--text-primary)' }}>
                        {cfg.label}
                      </span>
                    </div>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, color: cfg.color }}>
                      {stat.pct}%
                    </span>
                  </div>

                  {/* Progress bar */}
                  <div style={{ width: '100%', height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ width: `${stat.pct}%`, height: '100%', background: cfg.color, borderRadius: 2 }} />
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                    <span>{stat.count} item</span>
                    <strong style={{ color: 'var(--text-secondary)' }}>{formatRupiah(stat.total)}</strong>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="panel-card" style={{ marginBottom: '1.25rem', padding: '1rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.75rem', alignItems: 'center', flex: 1 }}>
            {/* Month Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Calendar size={15} style={{ color: 'var(--accent-cyan)' }} />
              <select 
                value={monthFilter} 
                onChange={(e) => setMonthFilter(e.target.value)}
                className="form-select"
                style={{ minWidth: '150px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="">Semua Periode</option>
                {monthsList.map(m => (
                  <option key={m} value={m}>{getReadableMonth(m)}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Filter size={15} style={{ color: 'var(--accent-purple)' }} />
              <select 
                value={categoryFilter} 
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="form-select"
                style={{ minWidth: '180px', padding: '0.45rem 0.75rem', fontSize: '0.85rem' }}
              >
                <option value="ALL">Semua Kategori</option>
                {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                  <option key={key} value={key}>{cfg.label}</option>
                ))}
              </select>
            </div>

            {/* Search Input */}
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flex: 1, minWidth: '220px' }}>
              <div style={{ position: 'relative', width: '100%' }}>
                <Search size={15} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                <input 
                  type="text"
                  placeholder="Cari pengeluaran atau catatan..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="form-input"
                  style={{ paddingLeft: '2rem', paddingRight: '0.75rem', paddingTop: '0.45rem', paddingBottom: '0.45rem', fontSize: '0.85rem', width: '100%' }}
                />
              </div>
            </form>
          </div>

          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
            Menampilkan <strong>{expenses.length}</strong> transaksi
          </div>
        </div>
      </div>

      {/* Main Table */}
      <div className="panel-card" style={{ padding: 0, overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ margin: '0 auto 0.75rem auto', color: 'var(--accent-cyan)' }} />
            <p>Memuat data buku kas...</p>
          </div>
        ) : error ? (
          <div style={{ padding: '2.5rem 1rem', textAlign: 'center', color: 'var(--accent-rose)' }}>
            <AlertTriangle size={28} style={{ margin: '0 auto 0.5rem auto' }} />
            <p>{error}</p>
          </div>
        ) : expenses.length === 0 ? (
          <div style={{ padding: '3.5rem 1rem', textAlign: 'center', color: 'var(--text-muted)' }}>
            <Wallet size={36} style={{ margin: '0 auto 0.75rem auto', opacity: 0.35 }} />
            <strong style={{ display: 'block', fontSize: '1rem', color: 'var(--text-heading)', marginBottom: '0.3rem' }}>
              Belum Ada Pengeluaran
            </strong>
            <p style={{ fontSize: '0.85rem', maxWidth: '400px', margin: '0 auto 1.25rem auto' }}>
              Belum ada pencatatan biaya operasional pada periode ini. Klik tombol di bawah untuk mencatat pengeluaran pertama.
            </p>
            <button onClick={handleOpenAddModal} className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
              <Plus size={16} /> Catat Pengeluaran Sekarang
            </button>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px' }}>Tanggal</th>
                  <th>Pengeluaran</th>
                  <th style={{ width: '180px' }}>Kategori</th>
                  <th style={{ width: '110px' }}>Metode</th>
                  <th style={{ width: '140px', textAlign: 'right' }}>Nominal</th>
                  <th>Catatan</th>
                  <th style={{ width: '90px', textAlign: 'center' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((item) => {
                  const cfg = CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.OTHER;
                  const Icon = cfg.icon;
                  return (
                    <tr key={item.id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ color: 'var(--text-secondary)', fontSize: '0.82rem', whiteSpace: 'nowrap' }}>
                        {formatDateIndo(item.date)}
                      </td>
                      <td>
                        <strong style={{ color: 'var(--text-heading)', fontSize: '0.9rem', display: 'block' }}>
                          {item.title}
                        </strong>
                      </td>
                      <td>
                        <span 
                          style={{ 
                            display: 'inline-flex', 
                            alignItems: 'center', 
                            gap: '0.35rem', 
                            padding: '3px 8px', 
                            borderRadius: '20px', 
                            fontSize: '0.72rem', 
                            fontWeight: 600, 
                            background: cfg.bg, 
                            color: cfg.color, 
                            border: `1px solid ${cfg.color}30` 
                          }}
                        >
                          <Icon size={11} /> {cfg.label}
                        </span>
                      </td>
                      <td>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)' }}>
                          {item.paymentMethod || 'TRANSFER'}
                        </span>
                      </td>
                      <td style={{ textAlign: 'right', fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.92rem', whiteSpace: 'nowrap' }}>
                        - {formatRupiah(item.amount)}
                      </td>
                      <td style={{ color: 'var(--text-muted)', fontSize: '0.82rem', maxWidth: '220px' }}>
                        {item.notes || '–'}
                      </td>
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.35rem' }}>
                          <button 
                            onClick={() => handleOpenEditModal(item)} 
                            className="action-btn"
                            title="Edit pengeluaran"
                            style={{ color: 'var(--accent-cyan)' }}
                          >
                            <Edit3 size={15} />
                          </button>
                          <button 
                            onClick={() => handleDelete(item.id, item.title, item.amount)} 
                            className="action-btn"
                            title="Hapus pengeluaran"
                            style={{ color: 'var(--accent-rose)' }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal Tambah / Edit Pengeluaran */}
      {showModal && (
        <div 
          style={{ 
            position: 'fixed', 
            inset: 0, 
            background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(6px)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            zIndex: 9999, 
            padding: '1rem' 
          }}
        >
          <div 
            className="panel-card" 
            style={{ 
              maxWidth: '520px', 
              width: '100%', 
              maxHeight: '90vh', 
              overflowY: 'auto', 
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)', 
              border: '1px solid var(--border-glow)' 
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Wallet size={20} style={{ color: 'var(--accent-cyan)' }} />
                <h3 style={{ margin: 0, fontSize: '1.1rem', color: 'var(--text-heading)' }}>
                  {isEditing ? 'Edit Catatan Pengeluaran' : 'Catat Pengeluaran Baru'}
                </h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={20} />
              </button>
            </div>

            {formError && (
              <div style={{ background: 'rgba(244, 63, 94, 0.12)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#fb7185', padding: '0.65rem 0.85rem', borderRadius: 'var(--radius-sm)', marginBottom: '1rem', fontSize: '0.82rem' }}>
                {formError}
              </div>
            )}

            <form onSubmit={handleFormSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Judul Pengeluaran */}
              <div>
                <label className="form-label">
                  Nama / Judul Pengeluaran <span style={{ color: 'var(--accent-rose)' }}>*</span>
                </label>
                <input 
                  type="text" 
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  placeholder="Contoh: Sewa Bandwidth Telkom Astinet, Beli Dropcore 1 Roll" 
                  className="form-input" 
                  required
                />
              </div>

              {/* Kategori & Nominal Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">
                    Kategori <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <select 
                    value={form.category}
                    onChange={(e) => setForm({ ...form, category: e.target.value })}
                    className="form-select"
                  >
                    {Object.entries(CATEGORY_CONFIG).map(([key, cfg]) => (
                      <option key={key} value={key}>{cfg.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="form-label">
                    Nominal (Rp) <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <input 
                    type="number" 
                    min="1"
                    step="any"
                    value={form.amount}
                    onChange={(e) => setForm({ ...form, amount: e.target.value })}
                    placeholder="Contoh: 1500000" 
                    className="form-input" 
                    required
                  />
                </div>
              </div>

              {/* Tanggal & Metode Bayar Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">
                    Tanggal Transaksi <span style={{ color: 'var(--accent-rose)' }}>*</span>
                  </label>
                  <input 
                    type="date" 
                    value={form.date}
                    onChange={(e) => setForm({ ...form, date: e.target.value })}
                    className="form-input" 
                    required
                  />
                </div>

                <div>
                  <label className="form-label">Metode Pembayaran</label>
                  <select 
                    value={form.paymentMethod}
                    onChange={(e) => setForm({ ...form, paymentMethod: e.target.value })}
                    className="form-select"
                  >
                    <option value="TRANSFER">Transfer Bank</option>
                    <option value="CASH">Kas Tunai (Cash)</option>
                    <option value="QRIS">QRIS / e-Wallet</option>
                    <option value="DEBIT_CC">Debit / Kartu Kredit</option>
                  </select>
                </div>
              </div>

              {/* Catatan / Keterangan */}
              <div>
                <label className="form-label">Catatan Tambahan (Opsional)</label>
                <textarea 
                  value={form.notes}
                  onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  placeholder="Nomor invoice vendor, supplier, keterangan pekerjaan teknis, dll..."
                  className="form-input" 
                  rows={3}
                />
              </div>

              {/* Action Buttons */}
              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-color)' }}>
                <button 
                  type="button" 
                  onClick={() => setShowModal(false)} 
                  className="btn btn-secondary"
                  disabled={submitting}
                >
                  Batal
                </button>
                <button 
                  type="submit" 
                  className="btn btn-primary"
                  disabled={submitting}
                >
                  {submitting ? 'Menyimpan...' : (isEditing ? 'Simpan Perubahan' : 'Catat Pengeluaran')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
