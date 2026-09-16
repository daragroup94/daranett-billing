'use client';

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Wifi, 
  Receipt, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle, 
  ArrowUpRight,
  RefreshCw,
  Clock,
  BarChart3,
  Wallet,
  CreditCard,
  Search,
  Sparkles,
  Smartphone,
  Send,
  Sun,
  Moon,
  Sunrise,
  Sunset,
  Calendar,
  Activity,
  Zap,
  Layers,
  Flame
} from 'lucide-react';

// Lightweight animated number component
function AnimatedNumber({ 
  value, 
  formatter 
}: { 
  value: number; 
  formatter?: (v: number) => string 
}) {
  const [displayValue, setDisplayValue] = useState(0);

  useEffect(() => {
    const start = 0;
    const end = value || 0;
    if (start === end) {
      setDisplayValue(end);
      return;
    }

    const duration = 850;
    const startTime = performance.now();

    const update = (currentTime: number) => {
      const elapsed = currentTime - startTime;
      const progress = Math.min(elapsed / duration, 1);
      // Ease out cubic
      const ease = 1 - Math.pow(1 - progress, 3);
      const current = Math.round(start + (end - start) * ease);
      setDisplayValue(current);

      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        setDisplayValue(end);
      }
    };

    const animId = requestAnimationFrame(update);
    return () => cancelAnimationFrame(animId);
  }, [value]);

  return <>{formatter ? formatter(displayValue) : displayValue.toLocaleString('id-ID')}</>;
}

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
    overdueCustomers: [] as any[]
  });
  
  const [customers, setCustomers] = useState<any[]>([]);
  const [packagesList, setPackagesList] = useState<any[]>([]);
  const [invoices, setInvoices] = useState<any[]>([]);
  const [recentInvoices, setRecentInvoices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [activeBar, setActiveBar] = useState<number | null>(null);
  const [activePoint, setActivePoint] = useState<number | null>(null);
  const [chartFilter, setChartFilter] = useState<'all' | 'paid' | 'unpaid'>('all');
  const [growthMode, setGrowthMode] = useState<'monthly' | 'cumulative'>('monthly');
  const [invoiceSearch, setInvoiceSearch] = useState('');

  const fetchDashboardData = async (isManualRefresh = false) => {
    try {
      if (isManualRefresh) {
        setIsRefreshing(true);
      } else {
        setLoading(true);
      }
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
      const packagesData = await resPackages.json();
      const invoicesData = await resInvoices.json();

      setCustomers(customersData);
      setPackagesList(packagesData);
      setInvoices(invoicesData);

      const totalCustomers = customersData.length;
      const activeCustomers = customersData.filter((c: any) => c.status === 'ACTIVE').length;
      const suspendedCustomers = customersData.filter((c: any) => c.status === 'SUSPENDED').length;
      const totalPackages = packagesData.length;

      const projectedRevenue = customersData.reduce((sum: number, c: any) => {
        if (c.status === 'ACTIVE') {
          return sum + ((c.package?.price || 0) - (c.discount || 0));
        }
        return sum;
      }, 0);

      const now = new Date();
      const currentYear = now.getFullYear();
      const currentMonth = now.getMonth();
      const currentYearMonth = now.toISOString().substring(0, 7);
      
      const currentMonthInvoices = invoicesData.filter((inv: any) => inv.month === currentYearMonth);
      
      const collectedThisMonth = invoicesData
        .filter((inv: any) => {
          if (inv.status !== 'PAID' || !inv.paymentDate) return false;
          const pDate = new Date(inv.paymentDate);
          return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
        })
        .reduce((sum: number, inv: any) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidThisMonth = currentMonthInvoices
        .filter((inv: any) => inv.status === 'UNPAID')
        .reduce((sum: number, inv: any) => sum + (inv.amount - (inv.discount || 0)), 0);

      const unpaidCount = currentMonthInvoices.filter((inv: any) => inv.status === 'UNPAID').length;
      
      const paidCount = invoicesData.filter((inv: any) => {
        if (inv.status !== 'PAID' || !inv.paymentDate) return false;
        const pDate = new Date(inv.paymentDate);
        return pDate.getFullYear() === currentYear && pDate.getMonth() === currentMonth;
      }).length;

      const unpaidInvoicesAmount = invoicesData
        .filter((inv: any) => inv.status === 'UNPAID')
        .reduce((sum: number, inv: any) => sum + (inv.amount - (inv.discount || 0)), 0);
      
      const totalCarriedOverDebt = customersData.reduce((sum: number, c: any) => sum + (c.carriedOverDebt || 0), 0);
      const totalUnpaidAmount = unpaidInvoicesAmount + totalCarriedOverDebt;

      const totalUnpaidCount = invoicesData.filter((inv: any) => inv.status === 'UNPAID').length;

      const currentMonthNum = now.getMonth() + 1;
      const currentYearNum = now.getFullYear();
      
      const newCustomersThisMonth = customersData.filter((c: any) => {
        if (!c.joinDate) return false;
        const d = new Date(c.joinDate);
        return d.getMonth() + 1 === currentMonthNum && d.getFullYear() === currentYearNum;
      }).length;

      const checkIsOverdue = (inv: any) => {
        if (inv.status === 'PAID') return false;
        const checkNow = new Date();
        const [year, month] = inv.month.split('-').map(Number);
        const dueDay = inv.customer?.dueDate || 10;
        const dueDateObj = new Date(year, month - 1, dueDay, 23, 59, 59);
        return checkNow > dueDateObj;
      };

      const overdueCustomers = invoicesData
        .filter((inv: any) => inv.status === 'UNPAID' && checkIsOverdue(inv))
        .sort((a: any, b: any) => {
          const amtA = a.amount - (a.discount || 0);
          const amtB = b.amount - (b.discount || 0);
          return amtB - amtA;
        })
        .slice(0, 6);

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

      const sortedByRecency = [...invoicesData].sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setRecentInvoices(sortedByRecency.slice(0, 6));
    } catch (err) {
      console.error(err);
      setError('Gagal memuat data dashboard. Pastikan database dan server sudah aktif.');
    } finally {
      setLoading(false);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const formatRupiah = (val: number) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val || 0);
  };

  const formatCompactRupiah = (val: number) => {
    if (val >= 1000000000) return (val / 1000000000).toFixed(1).replace('.0', '') + ' M';
    if (val >= 1000000) return (val / 1000000).toFixed(1).replace('.0', '') + ' Jt';
    if (val >= 1000) return (val / 1000).toFixed(0) + ' Rb';
    return val ? val.toString() : '0';
  };

  const getGreetingDetails = () => {
    const hour = new Date().getHours();
    if (hour >= 5 && hour < 11) return { text: 'Selamat pagi', icon: Sunrise, color: '#f59e0b' };
    if (hour >= 11 && hour < 15) return { text: 'Selamat siang', icon: Sun, color: '#06b6d4' };
    if (hour >= 15 && hour < 18) return { text: 'Selamat sore', icon: Sunset, color: '#f97316' };
    return { text: 'Selamat malam', icon: Moon, color: '#8b5cf6' };
  };

  const getFormattedDate = () => {
    const options: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    return new Date().toLocaleDateString('id-ID', options);
  };

  const getAvatarStyle = (name: string) => {
    const palette = [
      { bg: 'rgba(6, 182, 212, 0.15)', text: '#06b6d4', border: 'rgba(6, 182, 212, 0.3)' },
      { bg: 'rgba(16, 185, 129, 0.15)', text: '#10b981', border: 'rgba(16, 185, 129, 0.3)' },
      { bg: 'rgba(139, 92, 246, 0.15)', text: '#8b5cf6', border: 'rgba(139, 92, 246, 0.3)' },
      { bg: 'rgba(244, 63, 94, 0.15)', text: '#f43f5e', border: 'rgba(244, 63, 94, 0.3)' },
      { bg: 'rgba(245, 158, 11, 0.15)', text: '#f59e0b', border: 'rgba(245, 158, 11, 0.3)' },
    ];
    let sum = 0;
    for (let i = 0; i < (name || '').length; i++) {
      sum += name.charCodeAt(i);
    }
    return palette[sum % palette.length];
  };

  const getInitials = (name: string) => {
    if (!name) return 'DN';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  const getWhatsAppReminderUrl = (customerName: string, phone: string, month: string, amount: number) => {
    if (!phone) return '#';
    let cleanPhone = phone.replace(/[^0-9]/g, '');
    if (cleanPhone.startsWith('0')) {
      cleanPhone = '62' + cleanPhone.substring(1);
    }
    const msg = `Halo Bpk/Ibu *${customerName}*,\n\nMengingatkan tagihan internet DaraNet Anda untuk periode *${month}* sebesar *${formatRupiah(amount)}* telah jatuh tempo.\n\nMohon untuk segera melakukan konfirmasi pembayaran agar layanan internet tetap aktif dan lancar.\n\nTerima kasih. 🙏\n_DaraNet RTRW Net Management_`;
    return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

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

  const getShortMonthName = (monthStr: string) => {
    if (!monthStr || monthStr.length < 7) return '';
    const monthIndex = parseInt(monthStr.substring(5, 7)) - 1;
    const names = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
    return names[monthIndex] + ' \'' + monthStr.substring(2, 4);
  };

  const getCustomerJoinMonth = (c: any) => {
    if (!c.joinDate) return '';
    try { return new Date(c.joinDate).toISOString().substring(0, 7); }
    catch (e) { return ''; }
  };

  const monthsList = getLast6Months();

  // Revenue trends for last 6 months
  const monthsData = monthsList.map(m => {
    const paid = invoices.filter((inv: any) => inv.month === m && inv.status === 'PAID').reduce((sum: number, inv: any) => sum + (inv.amount - (inv.discount || 0)), 0);
    const unpaid = invoices.filter((inv: any) => inv.month === m && inv.status === 'UNPAID').reduce((sum: number, inv: any) => sum + (inv.amount - (inv.discount || 0)), 0);
    return { month: m, label: getShortMonthName(m), paid, unpaid, total: paid + unpaid };
  });

  const maxRevenue = Math.max(...monthsData.map(d => d.total), 1000000);

  // Customer additions per month
  const customerGrowthData = monthsList.map(m => {
    const joined = customers.filter((c: any) => getCustomerJoinMonth(c) === m).length;
    return { month: m, label: getShortMonthName(m), joined };
  });

  // Cumulative customer base over time
  const cumulativeGrowthData = useMemo(() => {
    const earliestMonth = monthsList[0];
    const baseBefore = customers.filter((c: any) => {
      const jm = getCustomerJoinMonth(c);
      return jm && jm < earliestMonth;
    }).length;

    let running = baseBefore;
    return monthsList.map((m, idx) => {
      const newInMonth = customerGrowthData[idx].joined;
      running += newInMonth;
      return {
        month: m,
        label: getShortMonthName(m),
        total: running,
        joined: newInMonth
      };
    });
  }, [monthsList, customerGrowthData, customers]);

  // Active growth visualization dataset based on growthMode
  const activeGrowthData = useMemo(() => {
    if (growthMode === 'monthly') {
      return customerGrowthData.map(d => ({ ...d, value: d.joined }));
    }
    return cumulativeGrowthData.map(d => ({ ...d, value: d.total }));
  }, [growthMode, customerGrowthData, cumulativeGrowthData]);

  const maxGrowthVal = Math.max(...activeGrowthData.map(d => d.value), 4);
  const totalGrowth6Months = customerGrowthData.reduce((sum, d) => sum + d.joined, 0);

  // Package distribution breakdown
  const packageDistribution = useMemo(() => {
    if (!packagesList || packagesList.length === 0) return [];
    const dist = packagesList.map((pkg: any) => {
      const userCount = customers.filter((c: any) => c.package?.id === pkg.id || c.packageId === pkg.id).length;
      const share = stats.totalCustomers > 0 ? Math.round((userCount / stats.totalCustomers) * 100) : 0;
      const revenue = userCount * (pkg.price || 0);
      return {
        id: pkg.id,
        name: pkg.name,
        speed: pkg.speedDownload,
        price: pkg.price,
        userCount,
        share,
        revenue
      };
    });
    // Sort packages: subscribed first, then by speed/price
    return dist.sort((a, b) => b.userCount - a.userCount || a.price - b.price);
  }, [packagesList, customers, stats.totalCustomers]);

  const currentYearMonth = new Date().toISOString().substring(0, 7);
  const currentMonthPaidInvoices = invoices.filter((inv: any) => inv.month === currentYearMonth && inv.status === 'PAID');
  const currentMonthPaidCount = currentMonthPaidInvoices.length;
  const currentCashCount = currentMonthPaidInvoices.filter((i: any) => i.paymentMethod === 'CASH').length;
  const currentTransferCount = currentMonthPaidInvoices.filter((i: any) => i.paymentMethod === 'TRANSFER').length;
  const currentQrisCount = currentMonthPaidInvoices.filter((i: any) => i.paymentMethod === 'QRIS').length;

  const ringCircumference = 2 * Math.PI * 52;

  const filteredRecentInvoices = useMemo(() => {
    if (!invoiceSearch.trim()) return recentInvoices;
    const q = invoiceSearch.toLowerCase();
    return recentInvoices.filter((inv: any) => 
      inv.customer?.name?.toLowerCase().includes(q) ||
      inv.customer?.phone?.includes(q) ||
      inv.month?.includes(q) ||
      inv.customer?.package?.name?.toLowerCase().includes(q)
    );
  }, [recentInvoices, invoiceSearch]);

  const greeting = getGreetingDetails();
  const GreetingIcon = greeting.icon;

  if (loading) {
    return (
      <div className="db-loading-state">
        <div className="db-loader-spinner">
          <RefreshCw className="animate-spin" size={36} />
        </div>
        <div className="db-loading-text">
          <h3>Memuat DaraNet Manager...</h3>
          <p>Sinkronisasi data pelanggan, tagihan, & mikrotik</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="db-error-state">
        <div className="db-error-icon">
          <AlertTriangle size={48} />
        </div>
        <h2>Gagal Terhubung ke Layanan</h2>
        <p>{error}</p>
        <button onClick={() => fetchDashboardData(true)} className="btn btn-primary">
          <RefreshCw size={15} /> Coba Sambungkan Lagi
        </button>
      </div>
    );
  }

  return (
    <>
      <style>{`
        /* ── Modern Dashboard Keyframe Animations ── */
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(8px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(16px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes pulseGlow {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%      { opacity: 0.5; transform: scale(1.1); }
        }
        @keyframes ringFill {
          from { stroke-dashoffset: ${ringCircumference}; }
          to   { stroke-dashoffset: ${ringCircumference * (1 - collectionPercentage / 100)}; }
        }

        .db-container {
          display: flex;
          flex-direction: column;
          gap: 1.35rem;
          width: 100%;
        }

        /* ── Loading & Error States ── */
        .db-loading-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 65vh;
          gap: 1.25rem;
          text-align: center;
        }
        .db-loader-spinner {
          width: 64px;
          height: 64px;
          border-radius: 20px;
          background: rgba(6, 182, 212, 0.1);
          border: 1px solid rgba(6, 182, 212, 0.25);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-cyan);
          box-shadow: 0 0 25px rgba(6, 182, 212, 0.2);
        }
        .db-loading-text h3 {
          font-size: 1.15rem;
          font-weight: 700;
          color: var(--text-heading);
          margin-bottom: 0.25rem;
        }
        .db-loading-text p {
          font-size: 0.85rem;
          color: var(--text-secondary);
        }

        .db-error-state {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          min-height: 60vh;
          gap: 1.2rem;
          text-align: center;
          max-width: 480px;
          margin: 0 auto;
        }
        .db-error-icon {
          width: 72px;
          height: 72px;
          border-radius: 24px;
          background: rgba(244, 63, 94, 0.12);
          border: 1px solid rgba(244, 63, 94, 0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--accent-rose);
        }

        /* ── Executive Hero Banner ── */
        .db-hero-banner {
          background: var(--glass-bg, rgba(15, 23, 42, 0.75));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          border-radius: 20px;
          padding: 1.35rem 1.65rem;
          display: flex;
          align-items: center;
          justify-content: space-between;
          position: relative;
          overflow: hidden;
          box-shadow: 0 10px 30px -10px rgba(0, 0, 0, 0.25);
          animation: fadeIn 0.4s ease-out;
        }
        .db-hero-banner::before {
          content: '';
          position: absolute;
          top: -50%;
          right: -10%;
          width: 320px;
          height: 320px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(6, 182, 212, 0.12) 0%, transparent 70%);
          pointer-events: none;
        }
        .db-hero-banner::after {
          content: '';
          position: absolute;
          bottom: -50%;
          left: 15%;
          width: 260px;
          height: 260px;
          border-radius: 50%;
          background: radial-gradient(circle, rgba(139, 92, 246, 0.08) 0%, transparent 70%);
          pointer-events: none;
        }
        .db-hero-content {
          position: relative;
          z-index: 1;
        }
        .db-hero-greeting-row {
          display: flex;
          align-items: center;
          gap: 0.6rem;
          margin-bottom: 0.3rem;
        }
        .db-hero-title {
          font-size: 1.45rem;
          font-weight: 800;
          letter-spacing: -0.3px;
          color: var(--text-heading);
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .db-hero-meta {
          display: flex;
          align-items: center;
          gap: 0.85rem;
          font-size: 0.82rem;
          color: var(--text-secondary);
          flex-wrap: wrap;
        }
        .db-hero-status-pill {
          display: inline-flex;
          align-items: center;
          gap: 0.4rem;
          padding: 0.2rem 0.55rem;
          border-radius: 20px;
          background: rgba(16, 185, 129, 0.1);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          font-size: 0.72rem;
          font-weight: 600;
        }
        .db-hero-status-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #10b981;
          box-shadow: 0 0 8px #10b981;
          animation: pulseGlow 2s infinite;
        }
        .db-hero-actions {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          position: relative;
          z-index: 1;
          flex-wrap: wrap;
        }
        .db-hero-refresh-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.45rem;
          padding: 0.55rem 0.95rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          background: var(--hover-overlay);
          border: 1px solid var(--border-color);
          color: var(--text-secondary);
          transition: all 0.2s ease;
        }
        .db-hero-refresh-btn:hover {
          background: var(--hover-overlay-strong);
          color: var(--text-heading);
          border-color: var(--accent-cyan);
        }
        .db-hero-primary-btn {
          display: inline-flex;
          align-items: center;
          gap: 0.5rem;
          padding: 0.55rem 1.15rem;
          border-radius: 10px;
          font-size: 0.82rem;
          font-weight: 600;
          cursor: pointer;
          text-decoration: none;
          background: var(--gradient-primary);
          color: #fff;
          border: none;
          box-shadow: 0 4px 14px rgba(6, 182, 212, 0.25);
          transition: all 0.2s ease;
        }
        .db-hero-primary-btn:hover {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(6, 182, 212, 0.4);
          filter: brightness(1.05);
        }

        /* ── Modern Interactive Stat Cards Grid ── */
        .db-stat-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 1rem;
        }
        @media (max-width: 1100px) { .db-stat-grid { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 620px)  { .db-stat-grid { grid-template-columns: 1fr; } }

        .db-stat-card {
          background: var(--glass-bg, rgba(15, 23, 42, 0.75));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          border-radius: 18px;
          padding: 1.15rem 1.25rem 1rem 1.25rem;
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          position: relative;
          overflow: hidden;
          transition: all 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.2);
          text-decoration: none;
          color: inherit;
        }
        .db-stat-card:hover {
          transform: translateY(-3px);
          box-shadow: 0 12px 28px -8px rgba(0, 0, 0, 0.35);
          border-color: rgba(255, 255, 255, 0.15);
        }
        .db-stat-card::before {
          content: '';
          position: absolute;
          top: 0; left: 0; right: 0;
          height: 3px;
          border-radius: 18px 18px 0 0;
        }
        .db-stat-card.indigo::before  { background: linear-gradient(90deg, #6366f1, #818cf8); }
        .db-stat-card.emerald::before { background: linear-gradient(90deg, #10b981, #34d399); }
        .db-stat-card.cyan::before    { background: linear-gradient(90deg, #06b6d4, #38bdf8); }
        .db-stat-card.rose::before    { background: linear-gradient(90deg, #f43f5e, #fb7185); }

        .db-stat-card-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-stat-label {
          font-size: 0.72rem;
          font-weight: 700;
          letter-spacing: 0.5px;
          text-transform: uppercase;
          color: var(--text-secondary);
        }
        .db-stat-icon-wrapper {
          width: 32px;
          height: 32px;
          border-radius: 9px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: transform 0.2s ease;
        }
        .db-stat-card:hover .db-stat-icon-wrapper {
          transform: scale(1.08) rotate(3deg);
        }
        .db-stat-card.indigo  .db-stat-icon-wrapper { background: rgba(99, 102, 241, 0.12); color: #818cf8; border: 1px solid rgba(99, 102, 241, 0.25); }
        .db-stat-card.emerald .db-stat-icon-wrapper { background: rgba(16, 185, 129, 0.12); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.25); }
        .db-stat-card.cyan    .db-stat-icon-wrapper { background: rgba(6, 182, 212, 0.12); color: #38bdf8; border: 1px solid rgba(6, 182, 212, 0.25); }
        .db-stat-card.rose    .db-stat-icon-wrapper { background: rgba(244, 63, 94, 0.12); color: #fb7185; border: 1px solid rgba(244, 63, 94, 0.25); }

        .db-stat-value {
          font-size: 1.65rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.5px;
          color: var(--text-heading);
          font-variant-numeric: tabular-nums;
        }
        .db-stat-footer {
          font-size: 0.72rem;
          color: var(--text-secondary);
          display: flex;
          flex-direction: column;
          gap: 0.2rem;
          margin-top: auto;
          padding-top: 0.25rem;
        }
        .db-stat-ratio-bar {
          height: 4px;
          border-radius: 4px;
          background: rgba(255, 255, 255, 0.08);
          overflow: hidden;
          display: flex;
          margin: 0.25rem 0;
        }

        /* ── Command / Quick Action Bar ── */
        .db-command-bar {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 0.85rem;
        }
        @media (max-width: 900px) { .db-command-bar { grid-template-columns: repeat(2, 1fr); } }
        @media (max-width: 500px) { .db-command-bar { grid-template-columns: 1fr; } }

        .db-command-tile {
          background: var(--glass-bg, rgba(15, 23, 42, 0.6));
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
          border-radius: 14px;
          padding: 0.85rem 1rem;
          display: flex;
          align-items: center;
          gap: 0.75rem;
          text-decoration: none;
          color: inherit;
          transition: all 0.22s ease;
        }
        .db-command-tile:hover {
          background: var(--hover-overlay-strong);
          border-color: var(--accent-cyan);
          transform: translateY(-2px);
          box-shadow: 0 6px 18px rgba(0, 0, 0, 0.15);
        }
        .db-command-icon {
          width: 34px;
          height: 34px;
          border-radius: 10px;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: transform 0.2s ease;
        }
        .db-command-tile:hover .db-command-icon {
          transform: scale(1.1);
        }
        .db-command-info {
          flex: 1;
          min-width: 0;
        }
        .db-command-title {
          font-size: 0.82rem;
          font-weight: 700;
          color: var(--text-heading);
          display: block;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-command-desc {
          font-size: 0.68rem;
          color: var(--text-muted);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        .db-command-arrow {
          color: var(--text-muted);
          transition: transform 0.2s ease, color 0.2s ease;
          flex-shrink: 0;
        }
        .db-command-tile:hover .db-command-arrow {
          transform: translateX(2px);
          color: var(--accent-cyan);
        }

        /* ── Grid Layouts for Panels ── */
        .db-panel-row {
          display: grid;
          gap: 1.15rem;
        }
        .db-panel-row-2-1 { grid-template-columns: minmax(0, 2fr) minmax(0, 1fr); }
        .db-panel-row-3-2 { grid-template-columns: minmax(0, 3fr) minmax(0, 2fr); }
        @media (max-width: 960px) {
          .db-panel-row-2-1, .db-panel-row-3-2 { grid-template-columns: 1fr; }
        }

        /* ── Standard Panel ── */
        .db-panel {
          background: var(--glass-bg, rgba(15, 23, 42, 0.75));
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          border: 1px solid var(--border-color, rgba(255, 255, 255, 0.08));
          border-radius: 18px;
          padding: 1.25rem 1.4rem;
          display: flex;
          flex-direction: column;
          gap: 1rem;
          box-shadow: 0 4px 20px -5px rgba(0, 0, 0, 0.2);
        }
        .db-panel-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding-bottom: 0.75rem;
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
          flex-wrap: wrap;
          gap: 0.5rem;
        }
        .db-panel-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .db-panel-title {
          font-size: 0.95rem;
          font-weight: 700;
          color: var(--text-heading);
          display: flex;
          align-items: center;
          gap: 0.45rem;
        }
        .db-panel-subtitle {
          font-size: 0.7rem;
          color: var(--text-muted);
        }

        /* Segmented Filter Pills */
        .db-segmented-control {
          display: inline-flex;
          background: var(--hover-overlay);
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 2px;
          gap: 2px;
        }
        .db-segmented-btn {
          background: transparent;
          border: none;
          color: var(--text-secondary);
          font-size: 0.7rem;
          font-weight: 600;
          padding: 0.25rem 0.6rem;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.18s ease;
        }
        .db-segmented-btn.active {
          background: var(--hover-overlay-strong);
          color: var(--text-heading);
          box-shadow: 0 1px 4px rgba(0,0,0,0.2);
        }
        .db-segmented-btn:hover:not(.active) {
          color: var(--text-heading);
        }

        /* Summary Chips Row for Growth Chart */
        .db-growth-chips {
          display: flex;
          align-items: center;
          gap: 0.65rem;
          flex-wrap: wrap;
        }
        .db-growth-chip {
          display: inline-flex;
          align-items: center;
          gap: 0.35rem;
          padding: 0.3rem 0.65rem;
          border-radius: 8px;
          background: var(--hover-overlay);
          border: 1px solid var(--border-color);
          font-size: 0.72rem;
          color: var(--text-secondary);
        }
        .db-growth-chip strong {
          color: var(--text-heading);
          font-weight: 700;
        }

        /* ── SVG Chart Tooltip ── */
        .db-tooltip {
          position: absolute;
          background: rgba(15, 23, 42, 0.94);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 10px;
          padding: 0.65rem 0.85rem;
          pointer-events: none;
          z-index: 40;
          min-width: 155px;
          box-shadow: 0 12px 24px -6px rgba(0, 0, 0, 0.6);
          animation: fadeIn 0.15s ease;
        }
        .db-tooltip-title {
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.6px;
          color: var(--text-muted);
          margin-bottom: 6px;
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding-bottom: 3px;
        }
        .db-tooltip-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 0.76rem;
          gap: 10px;
          margin-bottom: 3px;
        }
        .db-tooltip-dot {
          width: 7px;
          height: 7px;
          border-radius: 50%;
          display: inline-block;
          margin-right: 5px;
          flex-shrink: 0;
        }

        /* ── Package Distribution Breakdown Cards ── */
        .db-pkg-list {
          display: flex;
          flex-direction: column;
          gap: 0.65rem;
        }
        .db-pkg-item {
          background: var(--hover-overlay);
          border: 1px solid var(--border-color);
          border-radius: 12px;
          padding: 0.7rem 0.9rem;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          transition: all 0.2s ease;
        }
        .db-pkg-item:hover {
          background: var(--hover-overlay-strong);
          border-color: rgba(139, 92, 246, 0.3);
          transform: translateY(-1px);
        }
        .db-pkg-item-top {
          display: flex;
          align-items: center;
          justify-content: space-between;
        }
        .db-pkg-item-title-group {
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }
        .db-pkg-name {
          font-size: 0.85rem;
          font-weight: 700;
          color: var(--text-heading);
        }
        .db-pkg-speed-tag {
          font-size: 0.65rem;
          font-weight: 700;
          padding: 1px 6px;
          border-radius: 5px;
          background: rgba(139, 92, 246, 0.15);
          color: #c4b5fd;
          border: 1px solid rgba(139, 92, 246, 0.25);
        }
        .db-pkg-users-count {
          font-size: 0.8rem;
          font-weight: 700;
          color: var(--accent-cyan);
        }
        .db-pkg-progress-track {
          height: 6px;
          background: rgba(255, 255, 255, 0.06);
          border-radius: 99px;
          overflow: hidden;
        }
        .db-pkg-progress-fill {
          height: 100%;
          background: linear-gradient(90deg, #8b5cf6, #06b6d4);
          border-radius: 99px;
          transition: width 0.8s cubic-bezier(0.16, 1, 0.3, 1);
        }
        .db-pkg-item-bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          font-size: 0.68rem;
          color: var(--text-muted);
        }

        /* ── Tables & Lists ── */
        .db-table-search {
          display: flex;
          align-items: center;
          background: var(--input-bg, rgba(10, 14, 26, 0.45));
          border: 1px solid var(--border-color);
          border-radius: 8px;
          padding: 0.25rem 0.55rem;
          gap: 0.4rem;
          font-size: 0.75rem;
          color: var(--text-secondary);
        }
        .db-table-search input {
          background: transparent;
          border: none;
          outline: none;
          color: var(--text-primary);
          font-size: 0.75rem;
          width: 110px;
        }
        .db-table-search input::placeholder {
          color: var(--text-muted);
        }

        .db-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 0.82rem;
        }
        .db-table thead th {
          padding: 0.55rem 0.85rem;
          font-size: 0.68rem;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          color: var(--text-muted);
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.06));
          text-align: left;
        }
        .db-table tbody tr {
          border-bottom: 1px solid var(--border-color, rgba(255, 255, 255, 0.04));
          transition: background 0.18s ease;
        }
        .db-table tbody tr:last-child { border-bottom: none; }
        .db-table tbody tr:hover { background: var(--hover-overlay); }
        .db-table tbody td { padding: 0.65rem 0.85rem; vertical-align: middle; }

        .db-customer-cell {
          display: flex;
          align-items: center;
          gap: 0.65rem;
        }
        .db-avatar-circle {
          width: 30px;
          height: 30px;
          border-radius: 8px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
          font-size: 0.72rem;
          flex-shrink: 0;
        }
        .db-customer-name {
          font-weight: 600;
          color: var(--text-heading);
          text-decoration: none;
          display: block;
          line-height: 1.2;
          font-size: 0.83rem;
        }
        .db-customer-name:hover {
          color: var(--accent-cyan);
        }
        .db-customer-sub {
          font-size: 0.68rem;
          color: var(--text-muted);
          display: block;
          margin-top: 1px;
        }

        .db-badge-paid {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(16, 185, 129, 0.12);
          color: #34d399;
          border: 1px solid rgba(16, 185, 129, 0.25);
          padding: 0.18rem 0.5rem;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .db-badge-unpaid {
          display: inline-flex;
          align-items: center;
          gap: 0.25rem;
          background: rgba(244, 63, 94, 0.12);
          color: #fb7185;
          border: 1px solid rgba(244, 63, 94, 0.25);
          padding: 0.18rem 0.5rem;
          border-radius: 6px;
          font-size: 0.68rem;
          font-weight: 700;
        }
        .db-pkg-badge {
          background: rgba(139, 92, 246, 0.1);
          border: 1px solid rgba(139, 92, 246, 0.2);
          color: #c4b5fd;
          padding: 0.15rem 0.45rem;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 600;
        }

        /* ── Overdue Tunggakan Cards ── */
        .db-overdue-list {
          display: flex;
          flex-direction: column;
          gap: 0.55rem;
        }
        .db-overdue-card {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 0.7rem 0.9rem;
          border-radius: 12px;
          background: rgba(244, 63, 94, 0.04);
          border: 1px solid rgba(244, 63, 94, 0.15);
          border-left: 3px solid var(--accent-rose);
          transition: all 0.2s ease;
          gap: 0.75rem;
        }
        .db-overdue-card:hover {
          background: rgba(244, 63, 94, 0.08);
          transform: translateX(2px);
        }
        .db-overdue-info {
          flex: 1;
          min-width: 0;
        }
        .db-overdue-name {
          font-size: 0.83rem;
          font-weight: 700;
          color: var(--text-heading);
          display: block;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .db-overdue-meta {
          font-size: 0.68rem;
          color: var(--text-secondary);
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-top: 2px;
        }
        .db-overdue-actions {
          display: flex;
          align-items: center;
          gap: 0.4rem;
          flex-shrink: 0;
        }
        .db-overdue-wa-btn {
          width: 28px;
          height: 28px;
          border-radius: 8px;
          background: rgba(37, 211, 102, 0.12);
          border: 1px solid rgba(37, 211, 102, 0.25);
          color: #25d366;
          display: flex;
          align-items: center;
          justify-content: center;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .db-overdue-wa-btn:hover {
          background: #25d366;
          color: #fff;
          transform: scale(1.08);
        }
        .db-overdue-pay-btn {
          padding: 0.25rem 0.55rem;
          border-radius: 7px;
          font-size: 0.7rem;
          font-weight: 700;
          background: rgba(16, 185, 129, 0.12);
          border: 1px solid rgba(16, 185, 129, 0.25);
          color: #34d399;
          text-decoration: none;
          display: inline-flex;
          align-items: center;
          gap: 0.2rem;
          transition: all 0.2s ease;
        }
        .db-overdue-pay-btn:hover {
          background: #10b981;
          color: #fff;
        }
      `}</style>

      <div className="db-container">
        {/* ── Executive Hero Welcome Banner ── */}
        <header className="db-hero-banner">
          <div className="db-hero-content">
            <div className="db-hero-greeting-row">
              <GreetingIcon size={18} style={{ color: greeting.color }} />
              <span style={{ fontSize: '0.85rem', fontWeight: 600, color: greeting.color }}>
                {greeting.text}, Administrator
              </span>
              <span style={{ opacity: 0.4, color: 'var(--text-muted)' }}>&bull;</span>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <Calendar size={13} /> {getFormattedDate()}
              </span>
            </div>
            <h1 className="db-hero-title">
              Dashboard Operasional DaraNet
            </h1>
            <div className="db-hero-meta">
              <span className="db-hero-status-pill">
                <span className="db-hero-status-dot" />
                Sistem &amp; Router Online
              </span>
              <span>Total {stats.totalCustomers} Pelanggan Terdata</span>
              <span style={{ opacity: 0.4 }}>&bull;</span>
              <span>{stats.totalPackages} Paket Aktif</span>
            </div>
          </div>

          <div className="db-hero-actions">
            <button 
              onClick={() => fetchDashboardData(true)} 
              className="db-hero-refresh-btn"
              disabled={isRefreshing}
              title="Perbarui data secara manual"
            >
              <RefreshCw size={14} className={isRefreshing ? 'animate-spin' : ''} />
              {isRefreshing ? 'Menyinkronkan...' : 'Refresh'}
            </button>
            <Link href="/customers/new" className="db-hero-primary-btn">
              + Tambah Pelanggan
            </Link>
          </div>
        </header>

        {/* ── 4 Primary Metric Stat Cards with Smooth Number CountUp ── */}
        <section className="db-stat-grid">
          {/* Card 1 – Total Pelanggan */}
          <Link href="/customers" className="db-stat-card indigo" style={{ animation: 'slideUp 0.4s ease-out 0.05s both' }}>
            <div className="db-stat-card-top">
              <span className="db-stat-label">Total Pelanggan</span>
              <div className="db-stat-icon-wrapper">
                <Users size={16} />
              </div>
            </div>
            <div className="db-stat-value">
              <AnimatedNumber value={stats.totalCustomers} />
            </div>
            <div className="db-stat-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem' }}>
                <span style={{ color: 'var(--accent-teal)', fontWeight: 700 }}>{stats.activeCustomers} Aktif</span>
                <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>{stats.suspendedCustomers} Isolir</span>
              </div>
              <div className="db-stat-ratio-bar">
                <div style={{ 
                  width: `${stats.totalCustomers > 0 ? (stats.activeCustomers / stats.totalCustomers) * 100 : 0}%`, 
                  background: 'var(--accent-teal)' 
                }} />
                <div style={{ 
                  width: `${stats.totalCustomers > 0 ? (stats.suspendedCustomers / stats.totalCustomers) * 100 : 0}%`, 
                  background: 'var(--accent-rose)' 
                }} />
              </div>
              {stats.newCustomersThisMonth > 0 && (
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 3 }}>
                  <Sparkles size={11} /> +{stats.newCustomersThisMonth} pelanggan baru bulan ini
                </span>
              )}
            </div>
          </Link>

          {/* Card 2 – Omset Bulanan Proyeksi */}
          <div className="db-stat-card emerald" style={{ animation: 'slideUp 0.4s ease-out 0.12s both' }}>
            <div className="db-stat-card-top">
              <span className="db-stat-label">Proyeksi Omset</span>
              <div className="db-stat-icon-wrapper">
                <TrendingUp size={16} />
              </div>
            </div>
            <div className="db-stat-value">
              <AnimatedNumber value={stats.projectedRevenue} formatter={formatRupiah} />
            </div>
            <div className="db-stat-footer">
              <span>Estimasi pendapatan dari pelanggan aktif</span>
              <span style={{ color: 'var(--accent-teal)', fontWeight: 600 }}>
                {stats.activeCustomers} sambungan berjalan lancar
              </span>
            </div>
          </div>

          {/* Card 3 – Lunas Bulan Ini */}
          <Link href="/billing" className="db-stat-card cyan" style={{ animation: 'slideUp 0.4s ease-out 0.19s both' }}>
            <div className="db-stat-card-top">
              <span className="db-stat-label">Terbayar Bulan Ini</span>
              <div className="db-stat-icon-wrapper">
                <CheckCircle size={16} />
              </div>
            </div>
            <div className="db-stat-value">
              <AnimatedNumber value={stats.collectedThisMonth} formatter={formatRupiah} />
            </div>
            <div className="db-stat-footer">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ color: 'var(--accent-cyan)', fontWeight: 700 }}>
                  {stats.paidCount} Tagihan Lunas
                </span>
                <span style={{ fontSize: '0.68rem', background: 'rgba(6,182,212,0.12)', color: 'var(--accent-cyan)', padding: '1px 6px', borderRadius: 4, fontWeight: 700 }}>
                  {collectionPercentage}% Target
                </span>
              </div>
              <span style={{ color: 'var(--text-muted)' }}>Kas masuk bulan berjalan</span>
            </div>
          </Link>

          {/* Card 4 – Total Piutang / Tunggakan */}
          <Link href="/billing" className="db-stat-card rose" style={{ animation: 'slideUp 0.4s ease-out 0.26s both' }}>
            <div className="db-stat-card-top">
              <span className="db-stat-label">Total Belum Bayar</span>
              <div className="db-stat-icon-wrapper">
                <Clock size={16} />
              </div>
            </div>
            <div className="db-stat-value">
              <AnimatedNumber value={stats.totalUnpaidAmount} formatter={formatRupiah} />
            </div>
            <div className="db-stat-footer">
              <span style={{ color: 'var(--accent-rose)', fontWeight: 700 }}>
                {stats.totalUnpaidCount} tagihan menunggak
              </span>
              {stats.totalCarriedOverDebt > 0 && (
                <span style={{ color: 'var(--text-muted)' }}>
                  + {formatCompactRupiah(stats.totalCarriedOverDebt)} sisa hutang bawaan
                </span>
              )}
            </div>
          </Link>
        </section>

        {/* ── Quick Command Bar (Fast Action Tiles) ── */}
        <section className="db-command-bar">
          <Link href="/billing" className="db-command-tile">
            <div className="db-command-icon" style={{ background: 'rgba(6, 182, 212, 0.12)', color: 'var(--accent-cyan)' }}>
              <Receipt size={17} />
            </div>
            <div className="db-command-info">
              <span className="db-command-title">Billing &amp; Tagihan</span>
              <span className="db-command-desc">Kirim tagihan &amp; cetak bukti</span>
            </div>
            <ArrowUpRight size={14} className="db-command-arrow" />
          </Link>

          <Link href="/customers" className="db-command-tile">
            <div className="db-command-icon" style={{ background: 'rgba(16, 185, 129, 0.12)', color: 'var(--accent-teal)' }}>
              <Users size={17} />
            </div>
            <div className="db-command-info">
              <span className="db-command-title">Kelola Pelanggan</span>
              <span className="db-command-desc">Status isolir &amp; IP static</span>
            </div>
            <ArrowUpRight size={14} className="db-command-arrow" />
          </Link>

          <Link href="/packages" className="db-command-tile">
            <div className="db-command-icon" style={{ background: 'rgba(139, 92, 246, 0.12)', color: 'var(--accent-purple)' }}>
              <Wifi size={17} />
            </div>
            <div className="db-command-info">
              <span className="db-command-title">Paket Internet</span>
              <span className="db-command-desc">Profil kecepatan &amp; tarif</span>
            </div>
            <ArrowUpRight size={14} className="db-command-arrow" />
          </Link>

          <Link href="/laporan" className="db-command-tile">
            <div className="db-command-icon" style={{ background: 'rgba(245, 158, 11, 0.12)', color: 'var(--accent-amber)' }}>
              <BarChart3 size={17} />
            </div>
            <div className="db-command-info">
              <span className="db-command-title">Laporan Finansial</span>
              <span className="db-command-desc">Rekapitulasi omset bulanan</span>
            </div>
            <ArrowUpRight size={14} className="db-command-arrow" />
          </Link>
        </section>

        {/* ── Row 1 : Tren Realisasi Penagihan & Gauge Kolektibilitas ── */}
        <section className="db-panel-row db-panel-row-2-1">
          {/* Bar Chart – Tren Realisasi Penagihan */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-group">
                <BarChart3 size={17} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <span className="db-panel-title">Tren Penagihan 6 Bulan</span>
                  <span className="db-panel-subtitle">Perbandingan Kas Lunas vs Tunggakan</span>
                </div>
              </div>

              {/* View filter */}
              <div className="db-segmented-control">
                <button 
                  onClick={() => setChartFilter('all')} 
                  className={`db-segmented-btn ${chartFilter === 'all' ? 'active' : ''}`}
                >
                  Semua
                </button>
                <button 
                  onClick={() => setChartFilter('paid')} 
                  className={`db-segmented-btn ${chartFilter === 'paid' ? 'active' : ''}`}
                >
                  Lunas
                </button>
                <button 
                  onClick={() => setChartFilter('unpaid')} 
                  className={`db-segmented-btn ${chartFilter === 'unpaid' ? 'active' : ''}`}
                >
                  Tunggakan
                </button>
              </div>
            </div>

            <div style={{ position: 'relative', height: 210 }} onMouseLeave={() => setActiveBar(null)}>
              {/* Tooltip */}
              {activeBar !== null && (() => {
                const slotW = 420 / 6;
                const tipX = 55 + activeBar * slotW + slotW / 2;
                const d = monthsData[activeBar];
                const pct = d.total > 0 ? Math.round((d.paid / d.total) * 100) : 0;
                return (
                  <div className="db-tooltip" style={{ top: -10, left: tipX, transform: 'translateX(-50%)' }}>
                    <div className="db-tooltip-title">{d.label} ({d.month})</div>
                    <div className="db-tooltip-row">
                      <span><span className="db-tooltip-dot" style={{ background: '#10b981' }} />Lunas:</span>
                      <strong>{formatRupiah(d.paid)}</strong>
                    </div>
                    <div className="db-tooltip-row">
                      <span><span className="db-tooltip-dot" style={{ background: '#f43f5e' }} />Piutang:</span>
                      <strong>{formatRupiah(d.unpaid)}</strong>
                    </div>
                    <div className="db-tooltip-row" style={{ borderTop: '1px solid rgba(255,255,255,0.06)', paddingTop: 3, marginTop: 3 }}>
                      <span style={{ color: 'var(--text-muted)' }}>Efisiensi:</span>
                      <span style={{ color: pct >= 80 ? '#34d399' : '#fb7185', fontWeight: 700 }}>{pct}%</span>
                    </div>
                  </div>
                );
              })()}

              <svg width="100%" height="210" viewBox="0 0 490 210" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gPaidModern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#2dd4bf" />
                    <stop offset="100%" stopColor="#0d9488" />
                  </linearGradient>
                  <linearGradient id="gUnpaidModern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fb7185" />
                    <stop offset="100%" stopColor="#e11d48" />
                  </linearGradient>
                </defs>

                {/* Horizontal Guide Grid Lines */}
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

                {/* Modern Bars with Rounded Pill Tops */}
                {monthsData.map((d, idx) => {
                  const slotW = 420 / 6;
                  const barW = 24;
                  const x = 55 + idx * slotW + (slotW - barW) / 2;
                  
                  const showPaid = chartFilter === 'all' || chartFilter === 'paid';
                  const showUnpaid = chartFilter === 'all' || chartFilter === 'unpaid';

                  const paidAmt = showPaid ? d.paid : 0;
                  const unpaidAmt = showUnpaid ? d.unpaid : 0;

                  const pH = Math.max((paidAmt / maxRevenue) * 165, 0);
                  const uH = Math.max((unpaidAmt / maxRevenue) * 165, 0);
                  const pY = 185 - pH;
                  const uY = pY - uH;
                  const hot = activeBar === idx;

                  return (
                    <g 
                      key={idx} 
                      onMouseEnter={() => setActiveBar(idx)} 
                      style={{ cursor: 'pointer' }}
                      opacity={activeBar !== null && !hot ? 0.4 : 1}
                    >
                      {/* Interactive Hover Zone */}
                      <rect 
                        x={55 + idx * slotW + 2} 
                        y={10} 
                        width={slotW - 4} 
                        height={175}
                        fill={hot ? 'rgba(255,255,255,0.04)' : 'transparent'} 
                        rx="8" 
                      />
                      
                      {/* Paid Bar */}
                      {pH > 0 && (
                        <rect 
                          x={x} 
                          y={pY} 
                          width={barW} 
                          height={pH}
                          fill="url(#gPaidModern)" 
                          rx={uH === 0 ? 5 : 0}
                          style={{ transition: 'all 0.3s ease' }} 
                        />
                      )}

                      {/* Unpaid Bar */}
                      {uH > 0 && (
                        <rect 
                          x={x} 
                          y={uY} 
                          width={barW} 
                          height={uH}
                          fill="url(#gUnpaidModern)" 
                          rx={5}
                          style={{ transition: 'all 0.3s ease' }} 
                        />
                      )}

                      {/* Month Label */}
                      <text 
                        x={x + barW / 2} 
                        y="203" 
                        textAnchor="middle"
                        fill={hot ? 'var(--accent-cyan)' : 'rgba(255,255,255,0.45)'}
                        style={{ fontSize: '9.5px', fontWeight: hot ? 700 : 500, transition: 'fill 0.2s' }}
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Legend */}
            <div style={{ display: 'flex', gap: '1.25rem', justifyContent: 'center', fontSize: '0.74rem', color: 'var(--text-secondary)' }}>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, background: 'var(--accent-teal)', borderRadius: 3, display: 'inline-block' }} />
                Kas Lunas
              </span>
              <span style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                <span style={{ width: 10, height: 10, background: 'var(--accent-rose)', borderRadius: 3, display: 'inline-block' }} />
                Tunggakan Piutang
              </span>
            </div>
          </div>

          {/* Efisiensi Kolektibilitas Ring Gauge & Payment Channel */}
          <div className="db-panel" style={{ justifyContent: 'space-between' }}>
            <div className="db-panel-header">
              <div className="db-panel-title-group">
                <Activity size={17} style={{ color: 'var(--accent-teal)' }} />
                <div>
                  <span className="db-panel-title">Kolektibilitas Bulan Ini</span>
                  <span className="db-panel-subtitle">Tingkat kelancaran pembayaran</span>
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.9rem', width: '100%' }}>
              {/* Circular Gauge */}
              <div style={{ position: 'relative', width: 126, height: 126 }}>
                <svg width="126" height="126" viewBox="0 0 126 126">
                  <circle cx="63" cy="63" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
                  <circle 
                    cx="63" 
                    cy="63" 
                    r="52" 
                    fill="none"
                    stroke={collectionPercentage >= 80 ? 'var(--accent-teal)' : collectionPercentage >= 60 ? 'var(--accent-cyan)' : 'var(--accent-rose)'}
                    strokeWidth="9"
                    strokeLinecap="round"
                    strokeDasharray={ringCircumference}
                    strokeDashoffset={ringCircumference * (1 - collectionPercentage / 100)}
                    transform="rotate(-90 63 63)"
                    style={{ 
                      animation: 'ringFill 1.4s cubic-bezier(0.16, 1, 0.3, 1) forwards', 
                      transition: 'stroke-dashoffset 1s ease' 
                    }}
                  />
                </svg>
                <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  <span style={{ 
                    fontSize: '1.65rem', 
                    fontWeight: 800, 
                    lineHeight: 1, 
                    color: collectionPercentage >= 80 ? 'var(--accent-teal)' : collectionPercentage >= 60 ? 'var(--accent-cyan)' : 'var(--accent-rose)' 
                  }}>
                    {collectionPercentage}%
                  </span>
                  <span style={{ fontSize: '0.62rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', marginTop: 3 }}>
                    Lunas
                  </span>
                </div>
              </div>

              {/* Lunas vs Piutang Summary Grid */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', width: '100%', gap: '0.6rem' }}>
                <div style={{ background: 'rgba(16, 185, 129, 0.08)', border: '1px solid rgba(16, 185, 129, 0.2)', borderRadius: 10, padding: '0.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Sudah Terkumpul</span>
                  <strong style={{ fontSize: '0.88rem', color: '#34d399', display: 'block', marginTop: 2 }}>
                    {formatCompactRupiah(stats.collectedThisMonth)}
                  </strong>
                </div>

                <div style={{ background: 'rgba(244, 63, 94, 0.08)', border: '1px solid rgba(244, 63, 94, 0.2)', borderRadius: 10, padding: '0.5rem', textAlign: 'center' }}>
                  <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'block' }}>Belum Tertagih</span>
                  <strong style={{ fontSize: '0.88rem', color: '#fb7185', display: 'block', marginTop: 2 }}>
                    {formatCompactRupiah(stats.totalUnpaidAmount)}
                  </strong>
                </div>
              </div>

              {/* Payment Channel Breakdown */}
              <div style={{ width: '100%', paddingTop: '0.4rem', borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.72rem', color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
                  <span style={{ fontWeight: 600 }}>Metode Pembayaran:</span>
                  <span style={{ color: 'var(--text-muted)' }}>{currentMonthPaidCount} transaksi</span>
                </div>

                {currentMonthPaidCount > 0 ? (
                  <>
                    <div style={{ height: 6, borderRadius: 99, overflow: 'hidden', background: 'rgba(255,255,255,0.06)', display: 'flex', marginBottom: '0.45rem' }}>
                      <div style={{ width: `${(currentCashCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-cyan)' }} />
                      <div style={{ width: `${(currentTransferCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-purple)' }} />
                      <div style={{ width: `${(currentQrisCount / currentMonthPaidCount) * 100}%`, background: 'var(--accent-teal)' }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.66rem', color: 'var(--text-muted)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Wallet size={10} style={{ color: 'var(--accent-cyan)' }} /> Tunai ({currentCashCount})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <CreditCard size={10} style={{ color: 'var(--accent-purple)' }} /> Bank ({currentTransferCount})
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        <Smartphone size={10} style={{ color: 'var(--accent-teal)' }} /> QRIS ({currentQrisCount})
                      </span>
                    </div>
                  </>
                ) : (
                  <p style={{ fontSize: '0.72rem', color: 'var(--text-muted)', textAlign: 'center', margin: '0.4rem 0' }}>
                    Belum ada riwayat transaksi lunas bulan ini.
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* ── Row 2 : Pertumbuhan Pelanggan & Distribusi Paket Internet (3:2 Grid) ── */}
        <section className="db-panel-row db-panel-row-3-2">
          {/* Enhanced Customer Growth Hybrid Bar + Spline Chart */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-group">
                <Users size={17} style={{ color: 'var(--accent-purple)' }} />
                <div>
                  <span className="db-panel-title">Pertumbuhan Pelanggan</span>
                  <span className="db-panel-subtitle">Tren akuisisi &amp; akumulasi 6 bulan</span>
                </div>
              </div>

              {/* Mode Toggle */}
              <div className="db-segmented-control">
                <button 
                  onClick={() => setGrowthMode('monthly')} 
                  className={`db-segmented-btn ${growthMode === 'monthly' ? 'active' : ''}`}
                >
                  <Zap size={11} style={{ display: 'inline', marginRight: 3 }} /> Baru
                </button>
                <button 
                  onClick={() => setGrowthMode('cumulative')} 
                  className={`db-segmented-btn ${growthMode === 'cumulative' ? 'active' : ''}`}
                >
                  <Users size={11} style={{ display: 'inline', marginRight: 3 }} /> Akumulasi
                </button>
              </div>
            </div>

            {/* Growth Summary Metric Chips */}
            <div className="db-growth-chips">
              <div className="db-growth-chip">
                <span>Total Baru (6 Bln):</span>
                <strong style={{ color: 'var(--accent-purple)' }}>+{totalGrowth6Months} User</strong>
              </div>
              <div className="db-growth-chip">
                <span>Bulan Ini:</span>
                <strong style={{ color: 'var(--accent-cyan)' }}>+{stats.newCustomersThisMonth} User</strong>
              </div>
              <div className="db-growth-chip">
                <span>Rata-rata:</span>
                <strong>{(totalGrowth6Months / 6).toFixed(1)} /bln</strong>
              </div>
            </div>

            {/* Interactive SVG Visualization */}
            <div style={{ position: 'relative', height: 195 }} onMouseLeave={() => setActivePoint(null)}>
              {/* Tooltip */}
              {activePoint !== null && (() => {
                const slotW = 440 / 5;
                const d = activeGrowthData[activePoint];
                const px = 45 + activePoint * slotW;
                const bH = maxGrowthVal > 0 ? (d.value / maxGrowthVal) * 120 : 0;
                const py = 150 - bH;
                return (
                  <div className="db-tooltip" style={{ top: Math.max(py - 65, -10), left: px, transform: 'translateX(-50%)' }}>
                    <div className="db-tooltip-title">{d.label} ({d.month})</div>
                    <div className="db-tooltip-row">
                      <span><span className="db-tooltip-dot" style={{ background: '#a855f7' }} />{growthMode === 'monthly' ? 'Pelanggan Baru:' : 'Total Pelanggan:'}</span>
                      <strong style={{ color: '#c084fc' }}>{growthMode === 'monthly' ? `+${d.value}` : d.value} Orang</strong>
                    </div>
                    {growthMode === 'cumulative' && (
                      <div className="db-tooltip-row">
                        <span><span className="db-tooltip-dot" style={{ background: '#38bdf8' }} />Tambah Bulan Ini:</span>
                        <strong>+{(d as any).joined || 0} Orang</strong>
                      </div>
                    )}
                  </div>
                );
              })()}

              <svg width="100%" height="195" viewBox="0 0 510 195" preserveAspectRatio="none" style={{ overflow: 'visible' }}>
                <defs>
                  <linearGradient id="gAreaSplineModern" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#8b5cf6" stopOpacity="0.3" />
                    <stop offset="70%" stopColor="#8b5cf6" stopOpacity="0.06" />
                    <stop offset="100%" stopColor="#8b5cf6" stopOpacity="0" />
                  </linearGradient>
                  <linearGradient id="gBarPurple" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#a78bfa" />
                    <stop offset="100%" stopColor="#6366f1" />
                  </linearGradient>
                  <filter id="purpleGlow" x="-20%" y="-20%" width="140%" height="140%">
                    <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#8b5cf6" floodOpacity="0.45" />
                  </filter>
                </defs>

                {/* Horizontal Guide Grid Lines */}
                {[0, 0.5, 1].map((r, i) => {
                  const y = 150 - r * 120;
                  return (
                    <g key={i}>
                      <line x1="38" y1={y} x2="495" y2={y} stroke="rgba(255,255,255,0.06)" strokeDasharray={r === 0 ? '0' : '4 6'} />
                      <text x="32" y={y + 4} textAnchor="end" fill="rgba(255,255,255,0.3)" style={{ fontSize: '9px', fontWeight: 600 }}>
                        {Math.round(r * maxGrowthVal)}
                      </text>
                    </g>
                  );
                })}

                {/* Column Background Tracks & Interactive Bars */}
                {activeGrowthData.map((d, idx) => {
                  const slotW = 440 / 5;
                  const cx = 45 + idx * slotW;
                  const hot = activePoint === idx;
                  const barW = 28;
                  const val = d.value;
                  const bH = maxGrowthVal > 0 ? (val / maxGrowthVal) * 120 : 0;
                  const bY = 150 - bH;

                  return (
                    <g 
                      key={idx} 
                      onMouseEnter={() => setActivePoint(idx)} 
                      style={{ cursor: 'pointer' }}
                    >
                      {/* Column Slot Backdrop */}
                      <rect 
                        x={cx - slotW / 2 + 4} 
                        y={15} 
                        width={slotW - 8} 
                        height={140} 
                        fill={hot ? 'rgba(139, 92, 246, 0.08)' : 'rgba(255, 255, 255, 0.015)'} 
                        rx="8" 
                        stroke={hot ? 'rgba(139, 92, 246, 0.3)' : 'transparent'}
                        style={{ transition: 'all 0.2s ease' }}
                      />

                      {/* Vertical Column Bar */}
                      {val > 0 ? (
                        <rect 
                          x={cx - barW / 2} 
                          y={bY} 
                          width={barW} 
                          height={bH} 
                          fill="url(#gBarPurple)" 
                          rx="6"
                          opacity={activePoint !== null && !hot ? 0.45 : 0.85}
                          style={{ transition: 'all 0.25s ease' }}
                        />
                      ) : (
                        /* Subtle baseline indicator when 0 */
                        <rect 
                          x={cx - 10} 
                          y={148} 
                          width={20} 
                          height={3} 
                          fill="rgba(255, 255, 255, 0.12)" 
                          rx="1.5"
                        />
                      )}

                      {/* Floating Metric Badge Above Active Bars */}
                      {val > 0 && (
                        <g transform={`translate(${cx}, ${bY - 14})`}>
                          <rect 
                            x={-16} 
                            y={-9} 
                            width={32} 
                            height={16} 
                            rx={5} 
                            fill="rgba(139, 92, 246, 0.25)" 
                            stroke="rgba(139, 92, 246, 0.45)" 
                            strokeWidth="1"
                          />
                          <text 
                            x={0} 
                            y={3} 
                            textAnchor="middle" 
                            fill="#c4b5fd" 
                            style={{ fontSize: '9.5px', fontWeight: 700 }}
                          >
                            {growthMode === 'monthly' ? `+${val}` : val}
                          </text>
                        </g>
                      )}

                      {/* Month Label */}
                      <text 
                        x={cx} 
                        y="176" 
                        textAnchor="middle"
                        fill={hot ? '#c084fc' : 'rgba(255,255,255,0.45)'}
                        style={{ fontSize: '10px', fontWeight: hot ? 700 : 500, transition: 'fill 0.2s' }}
                      >
                        {d.label}
                      </text>
                    </g>
                  );
                })}

                {/* Smooth Connecting Spline Curve */}
                {(() => {
                  const slotW = 440 / 5;
                  const pts = activeGrowthData.map((d, i) => ({
                    x: 45 + i * slotW,
                    y: 150 - (maxGrowthVal > 0 ? (d.value / maxGrowthVal) * 120 : 0)
                  }));

                  let line = `M ${pts[0].x} ${pts[0].y}`;
                  for (let i = 0; i < pts.length - 1; i++) {
                    const p0 = pts[Math.max(i - 1, 0)];
                    const p1 = pts[i];
                    const p2 = pts[i + 1];
                    const p3 = pts[Math.min(i + 2, pts.length - 1)];
                    const cp1x = p1.x + (p2.x - p0.x) * 0.18;
                    const cp1y = p1.y + (p2.y - p0.y) * 0.18;
                    const cp2x = p2.x - (p3.x - p1.x) * 0.18;
                    const cp2y = p2.y - (p3.y - p1.y) * 0.18;
                    line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
                  }
                  const area = `${line} L ${pts[pts.length - 1].x} 150 L ${pts[0].x} 150 Z`;

                  return (
                    <g pointerEvents="none">
                      <path d={area} fill="url(#gAreaSplineModern)" />
                      <path d={line} fill="none" stroke="#a855f7" strokeWidth="2.5" strokeLinecap="round" filter="url(#purpleGlow)" />
                      {pts.map((p, idx) => {
                        const hot = activePoint === idx;
                        return (
                          <circle 
                            key={idx}
                            cx={p.x} 
                            cy={p.y} 
                            r={hot ? 6 : 4}
                            fill={hot ? '#ffffff' : '#0f172a'}
                            stroke="#c084fc" 
                            strokeWidth={hot ? 2.5 : 2}
                            style={{ transition: 'all 0.2s ease' }} 
                          />
                        );
                      })}
                    </g>
                  );
                })()}
              </svg>
            </div>
          </div>

          {/* Package Distribution Breakdown Card */}
          <div className="db-panel" style={{ justifyContent: 'space-between' }}>
            <div className="db-panel-header">
              <div className="db-panel-title-group">
                <Wifi size={17} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <span className="db-panel-title">Pangsa Paket Internet</span>
                  <span className="db-panel-subtitle">Pilihan bandwidth terpopuler pelanggan</span>
                </div>
              </div>

              <Link href="/packages" style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                Semua Paket <ArrowUpRight size={11} />
              </Link>
            </div>

            <div className="db-pkg-list">
              {packageDistribution.slice(0, 4).map((pkg: any) => (
                <div key={pkg.id} className="db-pkg-item">
                  <div className="db-pkg-item-top">
                    <div className="db-pkg-item-title-group">
                      <span className="db-pkg-name">{pkg.name}</span>
                      <span className="db-pkg-speed-tag">{pkg.speed} Mbps</span>
                    </div>
                    <span className="db-pkg-users-count">
                      {pkg.userCount} Pelanggan
                    </span>
                  </div>

                  <div className="db-pkg-progress-track">
                    <div 
                      className="db-pkg-progress-fill" 
                      style={{ width: `${pkg.share || (pkg.userCount > 0 ? 100 : 0)}%` }}
                    />
                  </div>

                  <div className="db-pkg-item-bottom">
                    <span>{formatRupiah(pkg.price)} / bln</span>
                    <span style={{ fontWeight: 600, color: pkg.userCount > 0 ? 'var(--accent-teal)' : 'var(--text-muted)' }}>
                      Pangsa: {pkg.share}%
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: '1px solid var(--border-color, rgba(255,255,255,0.06))', paddingTop: '0.65rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem' }}>
              <span style={{ color: 'var(--text-muted)' }}>
                Total {packagesList.length} paket langganan aktif
              </span>
              <Link href="/packages" style={{ color: 'var(--accent-cyan)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
                Tambah Paket <ArrowUpRight size={12} />
              </Link>
            </div>
          </div>
        </section>

        {/* ── Row 3 : Tagihan Terbaru & Daftar Tunggakan Overdue ── */}
        <section className="db-panel-row db-panel-row-3-2">
          {/* Recent Invoices Table */}
          <div className="db-panel" style={{ padding: '1.25rem 0 0 0', gap: 0 }}>
            <div className="db-panel-header" style={{ padding: '0 1.4rem 0.85rem 1.4rem' }}>
              <div className="db-panel-title-group">
                <Receipt size={17} style={{ color: 'var(--accent-cyan)' }} />
                <div>
                  <span className="db-panel-title">Aktivitas Tagihan Terbaru</span>
                  <span className="db-panel-subtitle">Status invoice pelanggan terkini</span>
                </div>
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <div className="db-table-search">
                  <Search size={12} />
                  <input 
                    type="text" 
                    value={invoiceSearch}
                    onChange={(e) => setInvoiceSearch(e.target.value)}
                    placeholder="Cari pelanggan..." 
                  />
                </div>
                <Link href="/billing" style={{ fontSize: '0.74rem', color: 'var(--accent-cyan)', textDecoration: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', gap: 2 }}>
                  Semua <ArrowUpRight size={11} />
                </Link>
              </div>
            </div>

            {filteredRecentInvoices.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '2.5rem 1rem', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {invoiceSearch ? `Tidak ada tagihan yang cocok dengan "${invoiceSearch}"` : 'Belum ada data tagihan tersimpan.'}
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
                    {filteredRecentInvoices.map((inv: any) => {
                      const avatar = getAvatarStyle(inv.customer?.name);
                      return (
                        <tr key={inv.id}>
                          <td>
                            <div className="db-customer-cell">
                              <div className="db-avatar-circle" style={{ background: avatar.bg, color: avatar.text, border: `1px solid ${avatar.border}` }}>
                                {getInitials(inv.customer?.name)}
                              </div>
                              <div>
                                <Link href={`/customers/${inv.customer?.id}`} className="db-customer-name">
                                  {inv.customer?.name || 'Pelanggan'}
                                </Link>
                                <span className="db-customer-sub">
                                  {inv.customer?.phone || '–'}
                                </span>
                              </div>
                            </div>
                          </td>
                          <td style={{ color: 'var(--text-secondary)', fontWeight: 500, whiteSpace: 'nowrap' }}>
                            {inv.month}
                          </td>
                          <td>
                            <span className="db-pkg-badge">
                              {inv.customer?.package?.name || '–'}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>
                            {formatRupiah(inv.amount - (inv.discount || 0))}
                          </td>
                          <td>
                            <span className={inv.status === 'PAID' ? 'db-badge-paid' : 'db-badge-unpaid'}>
                              {inv.status === 'PAID' ? (
                                <><CheckCircle size={10} /> Lunas</>
                              ) : (
                                <><Clock size={10} /> Belum Bayar</>
                              )}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Overdue Customers List (Prioritas Penagihan) */}
          <div className="db-panel">
            <div className="db-panel-header">
              <div className="db-panel-title-group">
                <AlertTriangle size={17} style={{ color: stats.overdueCustomers?.length > 0 ? 'var(--accent-rose)' : 'var(--accent-teal)' }} />
                <div>
                  <span className="db-panel-title" style={{ color: stats.overdueCustomers?.length > 0 ? 'var(--accent-rose)' : undefined }}>
                    Daftar Tunggakan
                  </span>
                  <span className="db-panel-subtitle">Tagihan melewati tempo pembayaran</span>
                </div>
              </div>

              {stats.overdueCustomers?.length > 0 && (
                <span style={{ fontSize: '0.68rem', fontWeight: 700, padding: '2px 7px', borderRadius: 20, background: 'rgba(244,63,94,0.12)', color: '#fb7185', border: '1px solid rgba(244,63,94,0.25)' }}>
                  {stats.overdueCustomers.length} Prioritas
                </span>
              )}
            </div>

            <div className="db-overdue-list">
              {stats.overdueCustomers?.length > 0 ? (
                stats.overdueCustomers.map((inv: any) => {
                  const amt = inv.amount - (inv.discount || 0);
                  const dueDay = inv.customer?.dueDate || 10;
                  return (
                    <div key={inv.id} className="db-overdue-card">
                      <div className="db-overdue-info">
                        <strong className="db-overdue-name">{inv.customer?.name}</strong>
                        <div className="db-overdue-meta">
                          <span>Bulan {inv.month}</span>
                          <span>&bull;</span>
                          <span style={{ color: 'var(--accent-rose)', fontWeight: 600 }}>{formatRupiah(amt)}</span>
                          <span>&bull;</span>
                          <span>Tempo tgl {dueDay}</span>
                        </div>
                      </div>

                      <div className="db-overdue-actions">
                        {/* WhatsApp Quick Reminder */}
                        {inv.customer?.phone && (
                          <a 
                            href={getWhatsAppReminderUrl(inv.customer.name, inv.customer.phone, inv.month, amt)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="db-overdue-wa-btn"
                            title="Kirim pengingat WhatsApp"
                          >
                            <Send size={12} />
                          </a>
                        )}

                        {/* Direct Pay Link */}
                        <Link
                          href={`/billing?search=${encodeURIComponent(inv.customer?.name || '')}&month=${inv.month}&pay=${inv.id}`}
                          className="db-overdue-pay-btn"
                          title="Bayar tagihan sekarang"
                        >
                          Bayar <ArrowUpRight size={10} />
                        </Link>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.6rem', padding: '2.5rem 1rem', color: 'var(--accent-teal)', textAlign: 'center' }}>
                  <div style={{ width: 48, height: 48, borderRadius: '50%', background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <CheckCircle size={24} />
                  </div>
                  <div>
                    <strong style={{ display: 'block', fontSize: '0.9rem', color: 'var(--text-heading)', marginBottom: '0.2rem' }}>
                      Semua Tagihan Tertib!
                    </strong>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                      Tidak ada tagihan menunggak jatuh tempo saat ini.
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
