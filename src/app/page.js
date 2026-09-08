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
  Clock,
  BarChart3,
  Wallet,
  CreditCard,
  MapPin,
  X
} from 'lucide-react';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalCustomers: 0,
    activeCustomers: 0,
    suspendedCustomers: 0,
    totalPackages: 0,
    projectedRevenue: 0,
    collectedThisMonth: 0,
    unpaidThisMonth: 0,
    unpaidCount: 0,
    paidCount: 0,
    totalUnpaidAmount: 0,
    totalUnpaidCount: 0,
    totalCarriedOverDebt: 0,
    newCustomersThisMonth: 0,
    overdueCustomers: []
  });
  
  const [customers, setCustomers] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [recentInvoices, setRecentInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [activeBar, setActiveBar] = useState(null);
  const [activePoint, setActivePoint] = useState(null);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resCustomers, resPackages, resInvoices] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/packages'),
        fetch('/api/billing')
      ]);

      if (!resCustomers.ok || !resPackages.ok || !resInvoices.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const customersData = await resCustomers.json();
      const packages = await resPackages.json();
      const invoicesData = await resInvoices.json();

      setCustomers(customersData);
      setInvoices(invoicesData);

      const totalCustomers = customersData.length;
      const activeCustomers = customersData.filter(c => c.status === 'ACTIVE').length;
      const suspendedCustomers = customersData.filter(c => c.status === 'SUSPENDED').length;
      const totalPackages = packages.length;

      const projectedRevenue = customersData.reduce((sum, c) => {
        if (c.status === 'ACTIVE') {
          return sum + ((c.package?.price || 0) - (c.discount || 0));
        }
        return sum;
      }, 0);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentYearMonth = now.toISOString().substring(0, 7);
      
      const currentMonthInvoices = invoicesData.filter(inv => inv.month === currentYearMonth);
      
      const collectedThisMonth = invoicesData
        .filter(inv => {
          if (inv.status !== 'PAID' || !inv.paymentDate) return false;
          const pDate = new Date(inv.paymentDate);
          return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
        })
        .reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidThisMonth = currentMonthInvoices
        .filter(inv => inv.status === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidCount = currentMonthInvoices.filter(inv => inv.status === 'UNPAID').length;
      
      const paidCount = invoicesData.filter(inv => {
        if (inv.status !== 'PAID' || !inv.paymentDate) return false;
        const pDate = new Date(inv.paymentDate);
        return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
      }).length;

      const unpaidInvoicesAmount = invoicesData
        .filter(inv => inv.status === 'UNPAID')
        .reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
      
      const totalCarriedOverDebt = customersData.reduce((sum, c) => sum + (c.carriedOverDebt || 0), 0);
      const totalUnpaidAmount = unpaidInvoicesAmount + totalCarriedOverDebt;

      const totalUnpaidCount = invoicesData.filter(inv => inv.status === 'UNPAID').length;

      const currentMonthNum = now.getMonth() + 1;
      const currentYearNum = now.getFullYear();
      
      const newCustomersThisMonth = customersData.filter(c => {
        if (!c.joinDate) return false;
        const d = new Date(c.joinDate);
        return d.getMonth() + 1 === currentMonthNum && d.getFullYear() === currentYearNum;
      }).length;

      const checkIsOverdue = (inv) => {
        if (inv.status === 'PAID') return false;
        const checkNow = new Date();
        const [year, month] = inv.month.split('-').map(Number);
        const dueDay = inv.customer?.dueDate || 10;
        const dueDateObj = new Date(year, month - 1, dueDay, 23, 59, 59);
        return checkNow > dueDateObj;
      };

      const overdueCustomers = invoicesData
        .filter(inv => inv.status === 'UNPAID' && checkIsOverdue(inv))
        .sort((a, b) => {
          const amtA = a.amount - (a.discount || 0);
          const amtB = b.amount - (b.discount || 0);
          return amtB - amtA;
        })
        .slice(0, 5);

      setStats({
        totalCustomers,
        activeCustomers,
        suspendedCustomers,
        totalPackages,
        projectedRevenue,
        collectedThisMonth,
        unpaidThisMonth,
        unpaidCount,
        paidCount,
        totalUnpaidAmount,
        totalUnpaidCount,
        totalCarriedOverDebt,
        newCustomersThisMonth,
        overdueCustomers
      });

      const sortedByRecency = [...invoicesData].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setRecentInvoices(sortedByRecency.slice(0, 5));
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return 'Selamat pagi';
    if (hour >= 11 && hour < 15) return 'Selamat siang';
    if (hour >= 15 && hour < 18) return 'Selamat sore';
    return 'Selamat malam';
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={40} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Memuat data dashboard DaraNet...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center', maxWidth: '500px', margin: '0 auto' }}>
        <AlertTriangle size={56} style={{ color: 'var(--accent-rose)' }} />
        <div>
          <h2 style={{ fontSize: '1.4rem', fontWeight: '700', marginBottom: '0.5rem' }}>Terjadi Kesalahan</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
        <button onClick={fetchDashboardData} className="btn btn-primary">
          <RefreshCw size={16} /> Coba Lagi
        </button>
      </div>
    );
  }

  const totalInvoicesCount = stats.paidCount + stats.unpaidCount;
  const collectionPercentage = totalInvoicesCount > 0 ? Math.round((stats.paidCount / totalInvoicesCount) * 100) : 0;

  const getLast6Months = () => {
    const list = [];
    const date = new Date();
    for (let i = 5; i >= 0; i--) {
      const d = new Date(date.getFullYear(), date.getMonth() - i, 1);
      list.push(d.toISOString().substring(0, 7));
    }
    return list;
  };

  const getShortMonthName = (monthStr) => {
    if (!monthStr || monthStr.length < 7) return '';
    const monthIndex = parseInt(monthStr.substring(5, 7)) - 1;
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return names[monthIndex] + ' \'' + monthStr.substring(2, 4);
  };

  const formatCompactRupiah = (val) => {
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + ' Jt';
    if (val >= 1000) return (val / 1000).toFixed(0) + ' Rb';
    return val.toString();
  };

  const getCustomerJoinMonth = (c) => {
    if (!c.joinDate) return '';
    try { return new Date(c.joinDate).toISOString().substring(0, 7); }
    catch (e) { return ''; }
  };

  const monthsList = getLast6Months();

  const monthsData = monthsList.map(m => {
    const paid = invoices.filter(inv => inv.month === m && inv.status === 'PAID').reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
    const unpaid = invoices.filter(inv => inv.month === m && inv.status === 'UNPAID').reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
    return { month: m, label: getShortMonthName(m), paid, unpaid, total: paid + unpaid };
  });

  const maxRevenue = Math.max(...monthsData.map(d => d.total), 1000000);

  const customerGrowthData = monthsList.map(m => {
    const joined = customers.filter(c => getCustomerJoinMonth(c) === m).length;
    return { month: m, label: getShortMonthName(m), joined };
  });

  const maxJoined = Math.max(...customerGrowthData.map(d => d.joined), 5);

  const currentYearMonth = new Date().toISOString().substring(0, 7);
  const currentMonthPaidInvoices = invoices.filter(inv => inv.month === currentYearMonth && inv.status === 'PAID');
  const currentMonthPaidCount = currentMonthPaidInvoices.length;
  const currentCashCount = currentMonthPaidInvoices.filter(i => i.paymentMethod === 'CASH').length;
  const currentTransferCount = currentMonthPaidInvoices.filter(i => i.paymentMethod === 'TRANSFER').length;
  const currentQrisCount = currentMonthPaidInvoices.filter(i => i.paymentMethod === 'QRIS').length;

  const ringCircumference = 2 * Math.PI * 52;

  return (
    <>
      <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(14px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
        @keyframes ringFill {
          from { stroke-dashoffset: ${ringCircumference}; }
          to   { stroke-dashoffset: ${ringCircumference * (1 - collectionPercentage / 100)}; }
        }

        /* ── Stat cards ────────────────────────────────── */
        .db-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
          margin-bottom: 1.5rem;
        }
        @media (max-width: 1100px) { .db-stat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 600px)  { .db-stat-grid { grid-template-columns: 1fr; } }

        .db-stat-card {
          background: var(--glass-bg, rgba(255,255,255,0.03));
          border: 1px solid var(--border-color, rgba(255,255,255,0.07));
          border-radius: 14px;
          padding: 1.25rem 1.35rem 1.1rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
          transition: transform 0.28s cubic-bezier(.16,1,.3,1), box-shadow 0.28s ease, border-color 0.28s ease;
        }
        .db-stat-card:hover {
          transform: translateY(-2px);
          border-color: rgba(255,255,255,0.12);
          box-shadow: 0 12px 28px -8px rgba(0,0,0,0.4);
        }
        .db-stat-card::after {
          content: '';
          position: absolute;
          inset: 0;
          pointer-events: none;
          border-radius: inherit;
          background: var(--card-shine, transparent);
          opacity: 0;
          transition: opacity 0.3s;
        }
        .db-stat-card:hover::after { opacity: 1; }

        /* colour accent strip on top edge */
        .db-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 2px;
          border-radius: 14px 14px 0 0;
        }
        .db-stat-card.indigo::before  { background: linear-gradient(90deg,#6366f1,#818cf8); }
        .db-stat-card.emerald::before { background: linear-gradient(90deg,#10b981,#34d399); }
        .db-stat-card.sky::before     { background: linear-gradient(90deg,#0ea5e9,#38bdf8); }
        .db-stat-card.rose::before    { background: linear-gradient(90deg,#f43f5e,#fb7185); }

        .db-stat-label {
          font-size: 0.72rem;
          font-weight: 600;
          letter-spacing: 0.6px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .db-stat-value {
          font-size: 1.7rem;
          font-weight: 800;
          line-height: 1.05;
          letter-spacing: -0.6px;
          color: var(--text-heading);
        }
        .db-stat-sub {
          font-size: 0.72rem;
          color: var(--text-secondary);
          margin-top: 0.1rem;
        }
        .db-stat-icon {
          position: absolute;
          top: 1.1rem;
          right: 1.1rem;
          width: 34px;
          height: 34px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .db-stat-card.indigo  .db-stat-icon { background: rgba(99,102,241,.1);  color: #818cf8; border: 1px solid rgba(99,102,241,.18); }
        .db-stat-card.emerald .db-stat-icon { background: rgba(16,185,129,.1);  color: #34d399; border: 1px solid rgba(16,185,129,.18); }
        .db-stat-card.sky     .db-stat-icon { background: rgba(14,165,233,.1);  color: #38bdf8; border: 1px solid rgba(14,165,233,.18); }
        .db-stat-card.rose    .db-stat-icon { background: rgba(244,63,94,.1);   color: #fb7185; border: 1px solid rgba(244,63,94,.18); }

        /* ── Layout helpers ───────────────────────────── */
        .db-row {
          display: grid;
          gap: 1.25rem;
          margin-bottom: 1.25rem;
        }
        .db-row-2-1 { grid-template-columns: minmax(0,2fr) minmax(0,1fr); }
        .db-row-3-2 { grid-template-columns: minmax(0,3fr) minmax(0,2fr); }
        @media (max-width: 900px) {
          .db-row-2-1, .db-row-3-2 { grid-template-columns: 1fr; }
        }

        /* ── Panel ────────────────────────────────────── */
        .db-panel {
          background: var(--glass-bg, rgba(255,255,255,0.025));
          border: 1px solid var(--border-color, rgba(255,255,255,0.06));
          border-radius: 14px;
          padding: 1.35rem 1.5rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
        }
        .db-panel-head {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.85rem;
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
        }
        .db-panel-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-heading);
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .db-panel-badge {
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.15rem 0.5rem;
          border-radius: 20px;
          background: rgba(244,63,94,.12);
          color: #fb7185;
          border: 1px solid rgba(244,63,94,.2);
        }

        /* ── Nav list items ───────────────────────────── */
        .db-nav-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.75rem 0.9rem;
          border-radius: 10px;
          border: 1px solid var(--border-color, rgba(255,255,255,0.04));
          background: rgba(255,255,255,0.01);
          text-decoration: none;
          color: inherit;
          transition: background 0.22s ease, border-color 0.22s ease, transform 0.22s ease;
        }
        .db-nav-item:hover {
          background: rgba(255,255,255,0.04);
          border-color: rgba(255,255,255,0.09);
          transform: translateX(3px);
        }

        /* ── Overdue list items ───────────────────────── */
        .db-overdue-item {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          padding: 0.7rem 0.85rem;
          border-radius: 10px;
          background: rgba(244,63,94,0.04);
          border: 1px solid rgba(244,63,94,0.14);
          border-left: 3px solid var(--accent-rose, #f43f5e);
          transition: background 0.2s ease;
        }
        .db-overdue-item:hover { background: rgba(244,63,94,0.07); }

        /* ── Chart tooltip ────────────────────────────── */
        .db-tooltip {
          position: absolute;
          background: rgba(10,15,28,0.92);
          backdrop-filter: blur(12px);
          border: 1px solid rgba(255,255,255,0.08);
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          pointer-events: none;
          z-index: 30;
          min-width: 145px;
          box-shadow: 0 10px 20px -8px rgba(0,0,0,0.5);
          animation: fadeIn 0.15s ease;
        }
        .db-tooltip-label {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          margin-bottom: 6px;
        }
        .db-tooltip-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.78rem;
          gap: 10px;
          margin-bottom: 3px;
        }
        .db-tooltip-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 4px;
          flex-shrink: 0;
        }

        /* ── Table ────────────────────────────────────── */
        .db-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.83rem;
        }
        .db-table thead th {
          padding: 0.5rem 0.75rem;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-secondary);
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.06));
          text-align: left;
        }
        .db-table tbody tr {
          border-bottom: 1px solid var(--border-color, rgba(255,255,255,0.04));
          transition: background 0.18s ease;
        }
        .db-table tbody tr:last-child { border-bottom: none; }
        .db-table tbody tr:hover { background: rgba(255,255,255,0.02); }
        .db-table tbody td { padding: 0.65rem 0.75rem; vertical-align: middle; }

        /* ── Status badges ────────────────────────────── */
        .db-badge {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          font-size: 0.68rem;
          font-weight: 700;
          padding: 0.18rem 0.5rem;
          border-radius: 20px;
          letter-spacing: 0.3px;
        }
        .db-badge-paid {
          background: rgba(16,185,129,.1);
          color: #34d399;
          border: 1px solid rgba(16,185,129,.2);
        }
        .db-badge-unpaid {
          background: rgba(244,63,94,.1);
          color: #fb7185;
          border: 1px solid rgba(244,63,94,.2);
        }
        .db-pkg-badge {
          background: rgba(139,92,246,.08);
          border: 1px solid rgba(139,92,246,.15);
          color: #c4b5fd;
          padding: 0.15rem 0.45rem;
          border-radius: 5px;
          font-size: 0.72rem;
          font-weight: 500;
        }
      `}</style>

      {/* ── Header ────────────────────────────────────────── */}
      <header className="top-header" style={{ marginBottom: '1.75rem' }}>
        <div className="header-title-container">
          <h1 style={{ letterSpacing: '-0.4px', fontSize: '1.5rem', fontWeight: 800 }}>Dashboard Utama</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            {getGreeting()}! Kelola operasional RTRW Net DaraNet Anda hari ini.
          </p>
        </div>
        <div className="header-actions" style={{ gap: '0.65rem' }}>
          <button onClick={fetchDashboardData} className="btn btn-secondary" title="Refresh data" style={{ borderRadius: '9px', fontSize: '0.85rem' }}>
            <RefreshCw size={15} /> Refresh
          </button>
          <Link href="/customers/new" className="btn btn-primary" style={{ borderRadius: '9px', background: 'var(--accent-teal)', fontSize: '0.85rem' }}>
            + Tambah Pelanggan
          </Link>
        </div>
      </header>

      {/* ── Stat Cards ────────────────────────────────────── */}
      <section className="db-stat-grid">
        {/* Card 1 – Pelanggan */}
        <div className="db-stat-card indigo" style={{ opacity: 0, animation: 'fadeUp .55s ease-out .05s forwards' }}>
          <div className="db-stat-icon"><Users size={16} /></div>
          <div className="db-stat-label">Total Pelanggan</div>
          <div className="db-stat-value">{stats.totalCustomers}</div>
          <div className="db-stat-sub">
            <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{stats.activeCustomers}</span>
            <span style={{ opacity: 0.5 }}> aktif &bull; </span>
            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{stats.suspendedCustomers}</span>
            <span style={{ opacity: 0.5 }}> isolir</span>
            {stats.newCustomersThisMonth > 0 && (
              <span style={{ display: 'block', color: 'var(--accent-cyan)', marginTop: '0.15rem', fontWeight: 600 }}>
                +{stats.newCustomersThisMonth} baru bulan ini
              </span>
            )}
          </div>
        </div>

        {/* Card 2 – Omset */}
        <div className="db-stat-card emerald" style={{ opacity: 0, animation: 'fadeUp .55s ease-out .15s forwards' }}>
          <div className="db-stat-icon"><TrendingUp size={16} /></div>
          <div className="db-stat-label">Omset Bulanan</div>
          <div className="db-stat-value" style={{ fontSize: '1.35rem' }}>{formatRupiah(stats.projectedRevenue)}</div>
          <div className="db-stat-sub">Estimasi dari pelanggan aktif</div>
        </div>

        {/* Card 3 – Lunas */}
        <div className="db-stat-card sky" style={{ opacity: 0, animation: 'fadeUp .55s ease-out .25s forwards' }}>
          <div className="db-stat-icon"><CheckCircle size={16} /></div>
          <div className="db-stat-label">Lunas Bulan Ini</div>
          <div className="db-stat-value" style={{ fontSize: '1.35rem' }}>{formatRupiah(stats.collectedThisMonth)}</div>
          <div className="db-stat-sub">
            <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>{stats.paidCount}</span>
            <span style={{ opacity: 0.6 }}> tagihan terbayar</span>
          </div>
        </div>

        {/* Card 4 – Belum Bayar */}
        <div className="db-stat-card rose" style={{ opacity: 0, animation: 'fadeUp .55s ease-out .35s forwards' }}>
          <div className="db-stat-icon"><Clock size={16} /></div>
          <div className="db-stat-label">Total Belum Bayar</div>
          <div className="db-stat-value" style={{ fontSize: '1.35rem' }}>{formatRupiah(stats.totalUnpaidAmount)}</div>
          <div className="db-stat-sub">
            <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{stats.totalUnpaidCount}</span>
            <span style={{ opacity: 0.6 }}> tagihan menunggak</span>
            {stats.totalCarriedOverDebt > 0 && (
              <span style={{ display: 'block', opacity: 0.7, marginTop: '0.12rem' }}>
                + {formatRupiah(stats.totalCarriedOverDebt)} sisa kurang bayar
              </span>
            )}
          </div>
        </div>
      </section>

      {/* ── Row 1 : Tren Penagihan & Kolektibilitas ───────── */}
      <section className="db-row db-row-2-1" style={{ opacity: 0, animation: 'fadeIn .7s ease-out .4s forwards' }}>
        
        {/* Bar chart – Tren Realisasi Penagihan */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">
              <BarChart3 size={16} style={{ color: 'var(--accent-cyan)' }} />
              Tren Realisasi Penagihan
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>6 Bulan Terakhir</span>
          </div>

          <div style={{ position: 'relative', height: 210 }} onMouseLeave={() => setActiveBar(null)}>
            {/* Tooltip */}
            {activeBar !== null && (() => {
              const slotW = 420 / 6;
              const tipX = 55 + activeBar * slotW + slotW / 2;
              return (
                <div className="db-tooltip" style={{ top: -8, left: tipX, transform: 'translateX(-50%)' }}>
                  <div className="db-tooltip-label">{monthsData[activeBar].label}</div>
                  <div className="db-tooltip-row">
                    <span><span className="db-tooltip-dot" style={{ background: 'var(--accent-teal)' }} />Lunas</span>
                    <strong>{formatCompactRupiah(monthsData[activeBar].paid)}</strong>
                  </div>
                  <div className="db-tooltip-row">
                    <span><span className="db-tooltip-dot" style={{ background: 'var(--accent-rose)' }} />Piutang</span>
                    <strong>{formatCompactRupiah(monthsData[activeBar].unpaid)}</strong>
                  </div>
                </div>
              );
            })()}

            <svg width="100%" height="210" viewBox="0 0 490 210" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gPaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#2dd4bf" />
                  <stop offset="100%" stopColor="#0d9488" />
                </linearGradient>
                <linearGradient id="gUnpaid" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#fb7185" />
                  <stop offset="100%" stopColor="#e11d48" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = 185 - r * 165;
                return (
                  <g key={i}>
                    <line x1="52" y1={y} x2="475" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray={r === 0 ? '0' : '4 6'} />
                    <text x="46" y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" style={{ fontSize: '9px', fontWeight: 600 }}>
                      {formatCompactRupiah(r * maxRevenue)}
                    </text>
                  </g>
                );
              })}

              {/* Bars */}
              {monthsData.map((d, idx) => {
                const slotW = 420 / 6;
                const barW = 22;
                const x = 55 + idx * slotW + (slotW - barW) / 2;
                const pH = Math.max((d.paid / maxRevenue) * 165, 0);
                const uH = Math.max((d.unpaid / maxRevenue) * 165, 0);
                const pY = 185 - pH;
                const uY = pY - uH;
                const hot = activeBar === idx;

                return (
                  <g key={idx} onMouseEnter={() => setActiveBar(idx)} style={{ cursor: 'pointer' }}
                    opacity={activeBar !== null && !hot ? 0.38 : 1}>
                    {/* hover zone */}
                    <rect x={55 + idx * slotW + 3} y={10} width={slotW - 6} height={175}
                      fill="transparent" rx="6" />
                    {hot && (
                      <rect x={55 + idx * slotW + 3} y={10} width={slotW - 6} height={175}
                        fill="rgba(255,255,255,0.03)" rx="6" />
                    )}
                    {d.paid > 0 && (
                      <rect x={x} y={pY} width={barW} height={pH}
                        fill="url(#gPaid)" rx={d.unpaid === 0 ? 4 : 0}
                        style={{ transition: 'opacity .3s' }} />
                    )}
                    {d.unpaid > 0 && (
                      <rect x={x} y={uY} width={barW} height={uH}
                        fill="url(#gUnpaid)" rx={4}
                        style={{ transition: 'opacity .3s' }} />
                    )}
                    <text x={x + barW / 2} y="204" textAnchor="middle"
                      fill={hot ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)'}
                      style={{ fontSize: '9.5px', fontWeight: hot ? 700 : 500, transition: 'fill .2s' }}>
                      {d.label}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Legend */}
          <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.72rem', color: 'var(--text-secondary)', marginTop: '-0.25rem' }}>
            {[['var(--accent-teal)', 'Tagihan Lunas'], ['var(--accent-rose)', 'Tunggakan / Belum Bayar']].map(([col, label]) => (
              <span key={label} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                <span style={{ width: 9, height: 9, background: col, borderRadius: 2, display: 'inline-block' }} />
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* Ring – Efisiensi Kolektibilitas */}
        <div className="db-panel" style={{ alignItems: 'center', justifyContent: 'center' }}>
          <div className="db-panel-head" style={{ width: '100%' }}>
            <span className="db-panel-title">Efisiensi Kolektibilitas</span>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem', width: '100%' }}>
            {/* Ring */}
            <div style={{ position: 'relative', width: 124, height: 124, flexShrink: 0 }}>
              <svg width="124" height="124" viewBox="0 0 124 124">
                <circle cx="62" cy="62" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                <circle cx="62" cy="62" r="52" fill="none"
                  stroke="var(--accent-teal)"
                  strokeWidth="9"
                  strokeLinecap="round"
                  strokeDasharray={ringCircumference}
                  strokeDashoffset={ringCircumference * (1 - collectionPercentage / 100)}
                  transform="rotate(-90 62 62)"
                  style={{ animation: 'ringFill 1.4s cubic-bezier(.16,1,.3,1) forwards', transition: 'stroke-dashoffset 1.2s ease' }}
                />
              </svg>
              <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '1.6rem', fontWeight: 800, lineHeight: 1, color: 'var(--accent-teal)' }}>{collectionPercentage}%</span>
                <span style={{ fontSize: '0.6rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-secondary)', marginTop: 2 }}>Lunas</span>
              </div>
            </div>

            {/* Summary row */}
            <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', fontSize: '0.75rem', gap: '0.5rem' }}>
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-teal)', fontSize: '0.82rem' }}>{formatCompactRupiah(stats.collectedThisMonth)}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>Lunas</div>
              </div>
              <div style={{ width: 1, background: 'var(--border-color, rgba(255,255,255,0.07))' }} />
              <div style={{ textAlign: 'center', flex: 1 }}>
                <div style={{ fontWeight: 700, color: 'var(--accent-rose)', fontSize: '0.82rem' }}>{formatCompactRupiah(stats.totalUnpaidAmount)}</div>
                <div style={{ color: 'var(--text-secondary)', marginTop: 2 }}>Piutang</div>
              </div>
            </div>

            {/* Payment method bar */}
            {currentMonthPaidCount > 0 ? (
              <div style={{ width: '100%', paddingTop: '0.5rem', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                <div style={{ height: 5, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', marginBottom: '0.5rem' }}>
                  <div style={{ width: `${(currentCashCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-cyan)' }} />
                  <div style={{ width: `${(currentTransferCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-purple)' }} />
                  <div style={{ width: `${(currentQrisCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-teal)' }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: 'var(--text-muted)' }}>
                  {[['var(--accent-cyan)', `Tunai (${currentCashCount})`],
                    ['var(--accent-purple)', `Bank (${currentTransferCount})`],
                    ['var(--accent-teal)', `QRIS (${currentQrisCount})`]].map(([col, lbl]) => (
                    <span key={lbl} style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                      <span style={{ width: 5, height: 5, borderRadius: '50%', background: col, display: 'inline-block' }} />
                      {lbl}
                    </span>
                  ))}
                </div>
              </div>
            ) : (
              <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: 0 }}>
                Belum ada data pembayaran lunas.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* ── Row 2 : Pertumbuhan Pelanggan & Nav Shortcuts ── */}
      <section className="db-row db-row-2-1" style={{ opacity: 0, animation: 'fadeIn .7s ease-out .55s forwards' }}>

        {/* Line chart – Pertumbuhan Pelanggan */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title">
              <Users size={16} style={{ color: 'var(--accent-purple)' }} />
              Pertumbuhan Pelanggan Baru
            </span>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>6 Bulan Terakhir</span>
          </div>

          <div style={{ position: 'relative', height: 210 }} onMouseLeave={() => setActivePoint(null)}>
            {/* Tooltip */}
            {activePoint !== null && (() => {
              const slotW = 425 / 5;
              const d = customerGrowthData[activePoint];
              const px = 47 + activePoint * slotW;
              const py = 185 - (d.joined / maxJoined) * 165;
              return (
                <div className="db-tooltip" style={{ top: py - 72, left: px, transform: 'translateX(-50%)' }}>
                  <div className="db-tooltip-label">{d.label}</div>
                  <div style={{ fontSize: '1.1rem', fontWeight: 800, color: '#c084fc', textAlign: 'center' }}>
                    +{d.joined} <span style={{ fontSize: '0.7rem', fontWeight: 500, color: 'var(--text-secondary)' }}>user</span>
                  </div>
                </div>
              );
            })()}

            <svg width="100%" height="210" viewBox="0 0 490 210" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
              <defs>
                <linearGradient id="gArea" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#a855f7" stopOpacity="0.22" />
                  <stop offset="100%" stopColor="#a855f7" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Grid */}
              {[0, 0.25, 0.5, 0.75, 1].map((r, i) => {
                const y = 185 - r * 165;
                return (
                  <g key={i}>
                    <line x1="42" y1={y} x2="475" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray={r === 0 ? '0' : '4 6'} />
                    <text x="36" y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" style={{ fontSize: '9px', fontWeight: 600 }}>
                      {Math.round(r * maxJoined)}
                    </text>
                  </g>
                );
              })}

              {/* Smooth line + area */}
              {(() => {
                const slotW = 425 / 5;
                const pts = customerGrowthData.map((d, i) => ({
                  x: 47 + i * slotW,
                  y: 185 - (d.joined / maxJoined) * 165
                }));

                let line = `M ${pts[0].x} ${pts[0].y}`;
                for (let i = 0; i < pts.length - 1; i++) {
                  const p0 = pts[Math.max(i - 1, 0)];
                  const p1 = pts[i];
                  const p2 = pts[i + 1];
                  const p3 = pts[Math.min(i + 2, pts.length - 1)];
                  const cp1x = p1.x + (p2.x - p0.x) * 0.15;
                  const cp1y = p1.y + (p2.y - p0.y) * 0.15;
                  const cp2x = p2.x - (p3.x - p1.x) * 0.15;
                  const cp2y = p2.y - (p3.y - p1.y) * 0.15;
                  line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                }
                const area = `${line} L ${pts[pts.length - 1].x} 185 L ${pts[0].x} 185 Z`;

                return (
                  <>
                    <path d={area} fill="url(#gArea)" />
                    <path d={line} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" />
                    {pts.map((p, idx) => {
                      const d = customerGrowthData[idx];
                      const hot = activePoint === idx;
                      return (
                        <g key={idx} onMouseEnter={() => setActivePoint(idx)} style={{ cursor: 'pointer' }}>
                          <circle cx={p.x} cy={p.y} r="15" fill="transparent" />
                          <circle cx={p.x} cy={p.y} r={hot ? 6 : 4}
                            fill={hot ? '#fff' : 'var(--glass-bg, #0f172a)'}
                            stroke="#a855f7" strokeWidth={hot ? 2.5 : 2}
                            style={{ transition: 'all .2s cubic-bezier(.16,1,.3,1)' }} />
                          <text x={p.x} y="204" textAnchor="middle"
                            fill={hot ? 'rgba(255,255,255,0.9)' : 'rgba(255,255,255,0.38)'}
                            style={{ fontSize: '9.5px', fontWeight: hot ? 700 : 500, transition: 'fill .2s' }}>
                            {d.label}
                          </text>
                        </g>
                      );
                    })}
                  </>
                );
              })()}
            </svg>
          </div>
        </div>

        {/* Navigation shortcuts */}
        <div className="db-panel" style={{ justifyContent: 'flex-start' }}>
          <div className="db-panel-head">
            <span className="db-panel-title">Tautan Navigasi</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.6rem' }}>
            <Link href="/billing" className="db-nav-item">
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(14,165,233,.08)', border: '1px solid rgba(14,165,233,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Receipt size={16} style={{ color: 'var(--accent-cyan)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-heading)' }}>Tagih &amp; Cetak</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Kirim WA &amp; cetak kwitansi</span>
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>

            <Link href="/customers" className="db-nav-item">
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(244,63,94,.08)', border: '1px solid rgba(244,63,94,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <XCircle size={16} style={{ color: 'var(--accent-rose)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-heading)' }}>Isolir Pelanggan</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Manajemen status isolir</span>
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>

            <Link href="/packages" className="db-nav-item">
              <div style={{ width: 34, height: 34, borderRadius: 8, background: 'rgba(139,92,246,.08)', border: '1px solid rgba(139,92,246,.16)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <Wifi size={16} style={{ color: 'var(--accent-purple)' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-heading)' }}>Paket Internet</strong>
                <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Kelola produk bandwidth</span>
              </div>
              <ArrowUpRight size={13} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
            </Link>
          </div>
        </div>
      </section>

      {/* ── Row 3 : Recent Invoices & Overdue ─────────────── */}
      <section className="db-row db-row-3-2" style={{ opacity: 0, animation: 'fadeIn .7s ease-out .7s forwards' }}>

        {/* Recent Invoices Table */}
        <div className="db-panel" style={{ padding: '1.35rem 0 0', gap: 0 }}>
          <div className="db-panel-head" style={{ padding: '0 1.5rem 0.85rem' }}>
            <span className="db-panel-title">Tagihan &amp; Aktivitas Terbaru</span>
            <Link href="/billing" style={{ fontSize: '0.75rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 3 }}>
              Semua Tagihan <ArrowUpRight size={11} />
            </Link>
          </div>

          {recentInvoices.length === 0 ? (
            <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
              Belum ada data tagihan.
            </p>
          ) : (
            <div style={{ overflowX: 'auto' }}>
              <table className="db-table">
                <thead>
                  <tr>
                    <th>Pelanggan</th>
                    <th>Bulan</th>
                    <th>Paket</th>
                    <th>Nominal</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {recentInvoices.map(inv => (
                    <tr key={inv.id}>
                      <td>
                        <Link href={`/customers/${inv.customer.id}`} style={{ color: 'var(--text-heading)', fontWeight: 600, textDecoration: 'none', fontSize: '0.85rem' }}>
                          {inv.customer.name}
                        </Link>
                        <span style={{ display: 'block', fontSize: '0.68rem', color: 'var(--text-secondary)', marginTop: 2 }}>
                          {inv.customer.phone}
                        </span>
                      </td>
                      <td style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>{inv.month}</td>
                      <td>
                        <span className="db-pkg-badge">{inv.customer.package?.name || '–'}</span>
                      </td>
                      <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                        {formatRupiah(inv.amount - (inv.discount || 0))}
                      </td>
                      <td>
                        <span className={`db-badge ${inv.status === 'PAID' ? 'db-badge-paid' : 'db-badge-unpaid'}`}>
                          {inv.status === 'PAID'
                            ? <><CheckCircle size={9} /> Lunas</>
                            : <><Clock size={9} /> Belum Bayar</>}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Overdue Customers */}
        <div className="db-panel">
          <div className="db-panel-head">
            <span className="db-panel-title" style={{ color: stats.overdueCustomers?.length > 0 ? 'var(--accent-rose)' : undefined }}>
              <AlertTriangle size={16} style={{ color: stats.overdueCustomers?.length > 0 ? 'var(--accent-rose)' : 'var(--text-muted)' }} />
              Daftar Tunggakan
            </span>
            {stats.overdueCustomers?.length > 0 && (
              <span className="db-panel-badge">{stats.overdueCustomers.length} User</span>
            )}
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.55rem' }}>
            {stats.overdueCustomers?.length > 0 ? (
              stats.overdueCustomers.map(inv => (
                <div key={inv.id} className="db-overdue-item">
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <strong style={{ display: 'block', fontSize: '0.83rem', color: 'var(--text-heading)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {inv.customer?.name}
                    </strong>
                    <span style={{ fontSize: '0.68rem', color: 'var(--text-secondary)' }}>Bulan: {inv.month}</span>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '0.83rem', fontWeight: 700, color: 'var(--accent-rose)' }}>
                      {formatCompactRupiah(inv.amount - (inv.discount || 0))}
                    </div>
                    <Link
                      href={`/billing?search=${encodeURIComponent(inv.customer?.name)}&month=${inv.month}&pay=${inv.id}`}
                      style={{ fontSize: '0.65rem', color: 'var(--accent-teal)', fontWeight: 700, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 2, justifyContent: 'flex-end', marginTop: 2 }}>
                      Bayar <ArrowUpRight size={10} />
                    </Link>
                  </div>
                </div>
              ))
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '2rem 1rem', color: 'var(--accent-teal)', textAlign: 'center' }}>
                <CheckCircle size={30} />
                <div>
                  <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-heading)', marginBottom: '0.2rem' }}>Tagihan Aman!</strong>
                  <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>Tidak ada tagihan menunggak tempo saat ini.</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </>
  );
}
