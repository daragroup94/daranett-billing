'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Receipt, 
  Search, 
  Filter, 
  MessageSquare, 
  Check, 
  Trash2, 
  RefreshCw, 
  Plus, 
  Calendar,
  AlertTriangle,
  Send,
  DollarSign,
  Printer,
  X,
  CheckCircle,
  Clock,
  TrendingUp,
  CreditCard,
  Wallet,
  MapPin,
  Download
} from 'lucide-react';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState(''); // '', 'PAID', 'UNPAID', 'OVERDUE', 'PENDING'

  const [monthFilter, setMonthFilter] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState(searchTerm);
  
  // Invoice Generation state
  const [generateMonth, setGenerateMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Payment Recording State
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [rollover, setRollover] = useState(true);
  const [payNotes, setPayNotes] = useState('');
  const [customerTotalUnpaid, setCustomerTotalUnpaid] = useState(0);
  const [customerUnpaidCount, setCustomerUnpaidCount] = useState(0);
  const [wilayahFilter, setWilayahFilter] = useState('');
  const [promiseDateStr, setPromiseDateStr] = useState('');

  // Calculate default months for dropdown (current month, last month, next month)
  const getMonthsList = () => {
    const list = [];
    const date = new Date();
    // Generate 6 months back and 2 months ahead
    for (let i = -6; i <= 2; i++) {
      const d = new Date(date.getFullYear(), date.getMonth() + i, 1);
      const val = d.toISOString().substring(0, 7); // "YYYY-MM"
      list.push(val);
    }
    return list.reverse();
  };

  const months = getMonthsList();

  const fetchInvoices = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const queryParams = new URLSearchParams();
      if (monthFilter && statusFilter !== 'UNPAID_ALL') queryParams.append('month', monthFilter);
      if (statusFilter === 'PAID') queryParams.append('status', 'PAID');
      else if (statusFilter === 'OVERDUE' || statusFilter === 'TODAY' || statusFilter === 'UNPAID_ALL') queryParams.append('status', 'UNPAID');

      if (debouncedSearch) queryParams.append('search', debouncedSearch);

      const res = await fetch(`/api/billing?${queryParams.toString()}`);
      if (!res.ok) throw new Error('Gagal mengambil data tagihan');
      const data = await res.json();
      setInvoices(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Set default month filter to current month
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const qSearch = params.get('search');
      const qMonth = params.get('month');
      const qPay = params.get('pay');

      const currentVal = new Date().toISOString().substring(0, 7);
      
      if (qMonth) {
        setMonthFilter(qMonth);
        setGenerateMonth(qMonth);
      } else {
        setMonthFilter(currentVal);
        setGenerateMonth(currentVal);
      }

      if (qSearch) {
        setSearchTerm(qSearch);
        setDebouncedSearch(qSearch);
      }

      if (qPay) {
        setPayInvoiceId(qPay);
      }
    }
  }, []);

  // Fetch total unpaid balance for the customer when modal opens
  useEffect(() => {
    if (payInvoiceId) {
      const selectedInvoice = invoices.find(inv => inv.id === payInvoiceId);
      if (selectedInvoice) {
        // Populate existing promise date and notes
        if (selectedInvoice.promiseDate) {
          setPromiseDateStr(new Date(selectedInvoice.promiseDate).toISOString().substring(0, 10));
        } else {
          setPromiseDateStr('');
        }
        setPayNotes(selectedInvoice.notes || '');

        fetch(`/api/customers/${selectedInvoice.customerId}`)
          .then(res => res.json())
          .then(data => {
            if (data && data.invoices) {
              const unpaid = data.invoices.filter(inv => inv.status === 'UNPAID');
              const total = unpaid.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
              setCustomerTotalUnpaid(total);
              setCustomerUnpaidCount(unpaid.length);
              setPayAmount(total.toString());
              setRollover(true);
            }
          })
          .catch(err => console.error('Error fetching customer invoices:', err));
      }
    } else {
      setCustomerTotalUnpaid(0);
      setCustomerUnpaidCount(0);
      setPromiseDateStr('');
    }
  }, [payInvoiceId, invoices]);

  // Debounce search term changes
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 400);
    return () => clearTimeout(handler);
  }, [searchTerm]);

  useEffect(() => {
    fetchInvoices();
  }, [monthFilter, statusFilter, debouncedSearch]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    if (!generateMonth) return;
    
    const confirmGen = confirm(`Apakah Anda yakin ingin menerbitkan tagihan massal untuk bulan ${generateMonth}?`);
    if (!confirmGen) return;
    
    setGenerating(true);
    setGenResult(null);
    try {
      const res = await fetch('/api/billing/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ month: generateMonth })
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Gagal generate billing bulanan');
      }

      setGenResult({
        success: true,
        message: data.message,
        generated: data.generated,
        skipped: data.skipped
      });
      
      // Refresh current table if viewing the generated month
      if (monthFilter === generateMonth) {
        fetchInvoices();
      }
    } catch (err) {
      setGenResult({
        success: false,
        message: err.message
      });
    } finally {
      setGenerating(false);
    }
  };

  const handleProcessPayment = async () => {
    setPayLoading(true);
    try {
      const selectedInvoice = invoices.find(inv => inv.id === payInvoiceId);
      const invoiceTotal = selectedInvoice ? selectedInvoice.amount - (selectedInvoice.discount || 0) : 0;
      const amountPaid = parseFloat(payAmount);

      const payload = {
        status: 'PAID',
        paymentMethod: payMethod,
        notes: payNotes
      };

      if (!isNaN(amountPaid) && (amountPaid !== invoiceTotal || customerUnpaidCount > 1)) {
        payload.paidAmount = amountPaid;
        payload.rollover = rollover;
      }

      const res = await fetch(`/api/billing/${payInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal merekam pembayaran');
      }

      setPayInvoiceId(null);
      setPayNotes('');
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleSavePromiseDate = async () => {
    setPayLoading(true);
    try {
      const res = await fetch(`/api/billing/${payInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'UNPAID',
          promiseDate: promiseDateStr || null,
          notes: payNotes || undefined
        })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menyimpan janji bayar');
      }

      setPayInvoiceId(null);
      setPromiseDateStr('');
      setPayNotes('');
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeleteInvoice = async (id) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tagihan pelanggan ini?')) return;

    try {
      const res = await fetch(`/api/billing/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) throw new Error('Gagal menghapus tagihan');
      fetchInvoices();
    } catch (err) {
      alert(err.message);
    }
  };

  const handleExportCSV = () => {
    // Get the filtered invoices matching the current UI state
    const filteredInvoices = invoices.filter(inv => {
      if (statusFilter === 'PAID') return inv.status === 'PAID';
      if (statusFilter === 'OVERDUE') return checkIsOverdue(inv);
      if (statusFilter === 'TODAY') return checkIsToday(inv);
      if (statusFilter === 'UNPAID_ALL') return inv.status === 'UNPAID';
      return true;
    }).filter(inv => {
      if (!wilayahFilter) return true;
      return inv.customer.wilayah?.toLowerCase().includes(wilayahFilter.toLowerCase());
    });

    if (filteredInvoices.length === 0) {
      alert('Tidak ada data untuk diekspor.');
      return;
    }

    const headers = [
      'Nama Pelanggan',
      'No. WA',
      'Wilayah/Rute',
      'Bulan Tagihan',
      'Paket Internet',
      'Nominal Tagihan',
      'Potongan',
      'Total Harus Dibayar',
      'Status',
      'Jatuh Tempo',
      'Link WA Reminder',
      'Link Bayar Online'
    ];

    const origin = typeof window !== 'undefined' ? window.location.origin : '';

    const rows = filteredInvoices.map((inv) => {
      const netAmount = inv.amount - (inv.discount || 0);
      const isOverdue = checkIsOverdue(inv);
      let statusStr = inv.status;
      if (inv.status === 'UNPAID') {
        statusStr = isOverdue ? 'MENUNGGAK' : 'BELUM BAYAR';
      } else if (inv.status === 'PAID') {
        statusStr = 'LUNAS';
      }

      // Generate WA reminder link
      const formattedPhone = inv.customer.phone.replace(/[^0-9]/g, '');
      let cleanPhone = formattedPhone;
      if (formattedPhone.startsWith('0')) {
        cleanPhone = '62' + formattedPhone.substring(1);
      }
      
      const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
      const year = inv.month.substring(0, 4);
      const monthIndex = parseInt(inv.month.substring(5, 7)) - 1;
      const readableMonth = monthNames[monthIndex] + " " + year;
      
      const msg = `Halo Bpk/Ibu *${inv.customer.name}*,\n\nKami dari *DaraNet ISP* menginfokan bahwa tagihan internet bulan *${readableMonth}* sebesar *${formatRupiah(netAmount)}* belum terbayar.\n\nLihat invoice & bayar online (QRIS/VA) di sini:\n${origin}/invoice/${inv.id}\n\nMohon segera melakukan pembayaran.\nTerima kasih.\n_DaraNet ISP_`;
      const waLink = `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(msg)}`;
      const payLink = `${origin}/invoice/${inv.id}`;

      return [
        `"${inv.customer.name.replace(/"/g, '""')}"`,
        `"${inv.customer.phone}"`,
        `"${(inv.customer.wilayah || '').replace(/"/g, '""')}"`,
        `"${inv.month}"`,
        `"${(inv.customer.package?.name || '').replace(/"/g, '""')}"`,
        inv.amount,
        inv.discount || 0,
        netAmount,
        `"${statusStr}"`,
        `"Tgl ${inv.customer.dueDate}"`,
        `"${waLink}"`,
        `"${payLink}"`
      ];
    });

    const csvContent = "\uFEFF" + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    
    // Create meaningful filename
    let filterName = 'semua';
    if (statusFilter === 'TODAY') filterName = 'jatuh_tempo_hari_ini';
    else if (statusFilter === 'OVERDUE') filterName = 'menunggak';
    else if (statusFilter === 'UNPAID_ALL') filterName = 'belum_bayar';
    
    const regionName = wilayahFilter ? `_${wilayahFilter.toLowerCase().replace(/\s+/g, '_')}` : '';
    const dateStr = new Date().toISOString().substring(0, 10);
    
    link.download = `data_penagihan_${filterName}${regionName}_${dateStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const checkIsOverdue = (inv) => {
    if (inv.status === 'PAID') return false;
    const now = new Date();
    const [year, month] = inv.month.split('-').map(Number);
    const dueDay = inv.customer.dueDate;
    const dueDateObj = new Date(year, month - 1, dueDay, 23, 59, 59);
    return now > dueDateObj;
  };

  const checkIsToday = (inv) => {
    if (inv.status === 'PAID') return false;
    const now = new Date();
    const [year, month] = inv.month.split('-').map(Number);
    const dueDay = inv.customer.dueDate;
    const dueDateObj = new Date(year, month - 1, dueDay, 23, 59, 59);
    // Is today if the current day matches dueDay, and it's not overdue
    return now.getDate() === dueDay && now <= dueDateObj;
  };

  const getWhatsAppLink = (inv) => {
    const formattedPhone = inv.customer.phone.replace(/[^0-9]/g, '');
    let cleanPhone = formattedPhone;
    if (formattedPhone.startsWith('0')) {
      cleanPhone = '62' + formattedPhone.substring(1);
    }

    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const year = inv.month.substring(0, 4);
    const monthIndex = parseInt(inv.month.substring(5, 7)) - 1;
    const readableMonth = monthNames[monthIndex] + " " + year;

    const billTotal = inv.amount - (inv.discount || 0);
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const message = `Halo Bpk/Ibu *${inv.customer.name}*,\n\nKami dari *DaraNet ISP* menginfokan bahwa tagihan internet bulan *${readableMonth}* sebesar *${formatRupiah(billTotal)}* sudah terbit.\n\nStatus tagihan saat ini: *BELUM LUNAS*.\nJatuh tempo pembayaran pada *tanggal ${inv.customer.dueDate}*.\n\nLihat invoice & bayar online (QRIS/VA) di sini:\n${origin}/invoice/${inv.id}\n\nTerima kasih.\n_DaraNet ISP_`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  // Calculate dynamic stats from invoices list
  const totalInvoices = invoices.length;
  const totalAmount = invoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
  
  const paidInvoices = invoices.filter(inv => inv.status === 'PAID');
  const paidCount = paidInvoices.length;
  const paidAmount = paidInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
  
  const unpaidInvoices = invoices.filter(inv => inv.status === 'UNPAID');
  const unpaidCount = unpaidInvoices.length;
  const unpaidAmount = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
  
  const overdueInvoices = invoices.filter(inv => checkIsOverdue(inv));
  const overdueCount = overdueInvoices.length;
  
  const collectionRate = totalInvoices > 0 ? Math.round((paidCount / totalInvoices) * 100) : 0;


  // Distribution of payment methods
  const cashCount = paidInvoices.filter(i => i.paymentMethod === 'CASH').length;
  const transferCount = paidInvoices.filter(i => i.paymentMethod === 'TRANSFER').length;
  const qrisCount = paidInvoices.filter(i => i.paymentMethod === 'QRIS').length;

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Keuangan & Tagihan Bulanan</h1>
          <p>Menerbitkan tagihan massal, merekam pembayaran pelanggan, dan memantau kolektibilitas DaraNet.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchInvoices} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </header>

      {/* Dynamic Statistics Dashboard Grid */}
      <section className="dashboard-grid">
        <div className="stat-card purple">
          <div className="stat-header">
            <span>Total Tagihan ({monthFilter || 'Bulan Ini'})</span>
            <div className="stat-icon"><Receipt size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem' }}>{formatRupiah(totalAmount)}</div>
          <div className="stat-desc">
            <span style={{ fontWeight: '600', color: 'var(--text-primary)' }}>{totalInvoices} tagihan</span> diterbitkan
          </div>
        </div>

        <div className="stat-card teal">
          <div className="stat-header">
            <span>Total Terbayar (Lunas)</span>
            <div className="stat-icon"><CheckCircle size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--accent-teal)' }}>{formatRupiah(paidAmount)}</div>
          <div className="stat-desc">
            <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>{paidCount} tagihan</span> lunas terbayar
          </div>
        </div>

        <div className="stat-card rose">
          <div className="stat-header">
            <span>Belum Terbayar (Piutang)</span>
            <div className="stat-icon"><Clock size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.8rem', color: 'var(--accent-rose)' }}>{formatRupiah(unpaidAmount)}</div>
          <div className="stat-desc">
            <span style={{ fontWeight: '600', color: 'var(--accent-rose)' }}>{unpaidCount} total</span> belum lunas, <span style={{ fontWeight: '600', color: '#ef4444' }}>{overdueCount} jatuh tempo</span>
          </div>
        </div>

        <div className="stat-card cyan">
          <div className="stat-header">
            <span>Collection Rate</span>
            <div className="stat-icon"><TrendingUp size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '2.2rem', color: 'var(--accent-cyan)' }}>{collectionRate}%</div>
          <div className="stat-desc">
            Kolektibilitas pembayaran bulan ini
          </div>
        </div>
      </section>

      {/* Reorganized Tools Section */}
      <section className="content-row">
        {/* Bulk Billing Generator Panel */}
        <div className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--accent-purple)' }} />
              Penerbitan Tagihan Bulanan (Bulk)
            </h2>
          </div>

          <form onSubmit={handleGenerateInvoices} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Fitur ini akan secara otomatis menerbitkan tagihan senilai harga paket internet kepada semua pelanggan berstatus <strong>ACTIVE</strong> atau <strong>GRACE PERIOD</strong> yang belum memiliki tagihan pada bulan yang dipilih.
            </p>

            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'flex-end' }}>
              <div style={{ flex: 1, minWidth: '200px' }}>
                <label className="form-label" style={{ display: 'block', marginBottom: '0.5rem' }}>Pilih Bulan Tagihan</label>
                <select 
                  value={generateMonth} 
                  onChange={(e) => setGenerateMonth(e.target.value)} 
                  className="form-select"
                  required
                >
                  {months.map(m => (
                    <option key={m} value={m}>{m}</option>
                  ))}
                </select>
              </div>

              <button type="submit" className="btn btn-primary" style={{ height: '44px' }} disabled={generating}>
                {generating ? (
                  <>
                    <RefreshCw className="animate-spin" size={18} /> Memproses...
                  </>
                ) : (
                  <>
                    <Plus size={18} /> Terbitkan Tagihan
                  </>
                )}
              </button>
            </div>

            {genResult && (
              <div style={{ 
                background: genResult.success ? 'rgba(20, 184, 166, 0.05)' : 'rgba(244, 63, 94, 0.05)', 
                border: `1px solid ${genResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)'}`, 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: genResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                <div>
                  <strong>{genResult.success ? 'Sukses!' : 'Gagal!'}</strong>
                  <p style={{ marginTop: '0.2rem', color: 'var(--text-primary)' }}>{genResult.message}</p>
                  {genResult.success && (
                    <ul style={{ marginLeft: '1.25rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                      <li>Tagihan baru dibuat: {genResult.generated} pelanggan</li>
                      <li>Dilewati (sudah ada): {genResult.skipped} pelanggan</li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Payment Methods Analytics Panel */}
        <div className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Wallet size={18} style={{ color: 'var(--accent-teal)' }} />
              Metode Pembayaran ({monthFilter || 'Bulan Ini'})
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'center', height: '100%' }}>
            {paidCount === 0 ? (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', textAlign: 'center', padding: '1rem 0' }}>
                Belum ada data pembayaran lunas untuk bulan ini.
              </p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {/* CASH Distribution */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '500' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-cyan)' }}></span>
                      CASH (Tunai)
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {cashCount} tagihan ({Math.round((cashCount / paidCount) * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(cashCount / paidCount) * 100}%`, height: '100%', background: 'var(--accent-cyan)', borderRadius: '3px' }}></div>
                  </div>
                </div>

                {/* TRANSFER Distribution */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '500' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-purple)' }}></span>
                      BANK TRANSFER
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {transferCount} tagihan ({Math.round((transferCount / paidCount) * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(transferCount / paidCount) * 100}%`, height: '100%', background: 'var(--accent-purple)', borderRadius: '3px' }}></div>
                  </div>
                </div>

                {/* QRIS Distribution */}
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem', marginBottom: '0.25rem' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontWeight: '500' }}>
                      <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--accent-teal)' }}></span>
                      QRIS / e-Wallet
                    </span>
                    <span style={{ color: 'var(--text-secondary)' }}>
                      {qrisCount} tagihan ({Math.round((qrisCount / paidCount) * 100)}%)
                    </span>
                  </div>
                  <div style={{ height: '6px', background: 'var(--border-color)', borderRadius: '3px', overflow: 'hidden' }}>
                    <div style={{ width: `${(qrisCount / paidCount) * 100}%`, height: '100%', background: 'var(--accent-teal)', borderRadius: '3px' }}></div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Payment Recording modal in-page overlay */}
      {payInvoiceId && (() => {
        const selectedInvoice = invoices.find(inv => inv.id === payInvoiceId);
        const invoiceTotal = selectedInvoice ? selectedInvoice.amount - (selectedInvoice.discount || 0) : 0;
        const isPaid = selectedInvoice ? selectedInvoice.status === 'PAID' : false;
        
        const totalToPay = customerUnpaidCount > 1 ? customerTotalUnpaid : invoiceTotal;
        const numPaid = parseFloat(payAmount) || 0;
        const isPartial = numPaid < totalToPay;
        const remaining = Math.max(0, totalToPay - numPaid);

        return (
          <section className="panel-card" style={{ border: '1px solid var(--accent-teal)', background: 'color-mix(in srgb, var(--accent-teal) 3%, transparent)', animation: 'fadeIn 0.3s ease-out' }}>
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ color: 'var(--accent-teal)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <CreditCard size={18} />
                Proses Pembayaran Tagihan — {selectedInvoice?.customer?.name}
              </h2>
              <button onClick={() => setPayInvoiceId(null)} className="action-btn" title="Tutup" style={{ color: 'var(--text-secondary)' }}>
                <X size={20} />
              </button>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1.25rem' }}>
                <div className="form-group">
                  <label className="form-label">
                    {customerUnpaidCount > 1 ? `Total Tagihan (${customerUnpaidCount} Bulan)` : 'Total Tagihan'}
                  </label>
                  <input 
                    type="text" 
                    className="form-input" 
                    value={formatRupiah(totalToPay)} 
                    disabled 
                    style={{ 
                      width: '100%', 
                      background: customerUnpaidCount > 1 ? 'rgba(244, 63, 94, 0.08)' : 'var(--hover-overlay)', 
                      cursor: 'not-allowed',
                      fontWeight: 'bold',
                      color: customerUnpaidCount > 1 ? 'var(--accent-rose)' : 'inherit',
                      border: customerUnpaidCount > 1 ? '1px solid rgba(244, 63, 94, 0.2)' : '1px solid var(--border-color)'
                    }} 
                  />
                </div>

                {customerUnpaidCount > 1 && (
                  <div className="form-group">
                    <label className="form-label">Tagihan Bulan Terpilih ({selectedInvoice?.month})</label>
                    <input type="text" className="form-input" value={formatRupiah(invoiceTotal)} disabled style={{ width: '100%', background: 'var(--hover-overlay)', cursor: 'not-allowed' }} />
                  </div>
                )}

                <div className="form-group">
                  <label className="form-label">Jumlah Dibayar (Rp)</label>
                  <input 
                    type="number" 
                    className="form-input" 
                    value={payAmount} 
                    onChange={(e) => setPayAmount(e.target.value)} 
                    placeholder="Masukkan jumlah bayar"
                    style={{ width: '100%' }} 
                  />
                </div>

                <div className="form-group">
                  <label className="form-label">Metode Pembayaran</label>
                  <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="form-select" style={{ width: '100%' }}>
                    <option value="CASH">CASH (Tunai)</option>
                    <option value="TRANSFER">BANK TRANSFER (Mandiri/BCA/BRI)</option>
                    <option value="QRIS">QRIS / e-Wallet (Gopay/OVO/Dana)</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Catatan Khusus (Keterangan Pembayaran)</label>
                <input 
                  type="text" 
                  className="form-input" 
                  value={payNotes} 
                  onChange={(e) => setPayNotes(e.target.value)} 
                  placeholder="Contoh: Bayar sebagian, sisa di-rollover bulan depan"
                  style={{ width: '100%' }} 
                />
              </div>

              {isPartial && numPaid > 0 && (
                <div style={{ 
                  background: 'color-mix(in srgb, var(--accent-rose) 6%, transparent)', 
                  border: '1px dashed var(--accent-rose)', 
                  padding: '1rem', 
                  borderRadius: '12px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '0.5rem'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.9rem' }}>
                    <span style={{ color: 'var(--text-secondary)' }}>Kurang Bayar (Sisa Hutang):</span>
                    <strong style={{ color: 'var(--accent-rose)' }}>{formatRupiah(remaining)}</strong>
                  </div>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', cursor: 'pointer', fontSize: '0.85rem', color: 'var(--text-primary)', marginTop: '0.25rem' }}>
                    <input 
                      type="checkbox" 
                      checked={rollover} 
                      onChange={(e) => setRollover(e.target.checked)}
                      style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                    />
                    Gabungkan sisa hutang {formatRupiah(remaining)} ini ke tagihan bulan depan
                  </label>
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button onClick={() => { setPayInvoiceId(null); setPayNotes(''); }} className="btn btn-secondary">Batal</button>
                <button onClick={handleProcessPayment} className="btn btn-primary" style={{ background: 'var(--accent-teal)', boxShadow: '0 4px 14px rgba(20, 184, 166, 0.25)' }} disabled={payLoading || numPaid <= 0}>
                  {payLoading ? 'Mencatat...' : (isPartial ? 'Konfirmasi Bayar Sebagian' : 'Konfirmasi Pembayaran Lunas')}
                </button>
              </div>

              {!isPaid && (
                <>
                  <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '1rem 0' }} />
                  <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px dashed var(--accent-amber)', padding: '1rem', borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <h3 style={{ fontSize: '0.9rem', fontWeight: '700', color: 'var(--accent-amber)', margin: 0 }}>Atur Janji Bayar (Bila Belum Bisa Bayar)</h3>
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: '180px' }}>
                        <label className="form-label" style={{ fontSize: '0.8rem', display: 'block', marginBottom: '0.25rem' }}>Tanggal Janji Bayar</label>
                        <input 
                          type="date" 
                          className="form-input" 
                          value={promiseDateStr} 
                          onChange={(e) => setPromiseDateStr(e.target.value)} 
                          style={{ width: '100%' }} 
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleSavePromiseDate} 
                        className="btn btn-primary" 
                        style={{ background: 'var(--accent-amber)', color: '#000', border: 'none', height: '42px', cursor: 'pointer' }} 
                        disabled={payLoading}
                      >
                        {payLoading ? 'Menyimpan...' : 'Simpan Janji Bayar'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          </section>
        );
      })()}

      {/* Invoices Database Panel */}
      <section className="panel-card">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1.25rem' }}>
          <h2 className="panel-title">Daftar Tagihan Pelanggan ({invoices.length})</h2>
          
          {/* Query Filters */}
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
            <form onSubmit={handleSearchSubmit} style={{ display: 'flex', position: 'relative', width: '220px' }}>
              <Search size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={searchTerm} 
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama pelanggan..." 
                className="form-input" 
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
            </form>

            <div style={{ display: 'flex', position: 'relative', width: '160px' }}>
              <MapPin size={16} style={{ position: 'absolute', left: '10px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
              <input 
                type="text" 
                value={wilayahFilter} 
                onChange={(e) => setWilayahFilter(e.target.value)}
                placeholder="Filter wilayah..." 
                className="form-input" 
                style={{ paddingLeft: '2.2rem', fontSize: '0.85rem' }}
              />
            </div>

            <select 
              value={statusFilter} 
              onChange={(e) => {
                const val = e.target.value;
                setStatusFilter(val);
                if (val === 'UNPAID_ALL') {
                  setMonthFilter('');
                }
              }} 
              className="form-select"
              style={{ width: '230px', fontSize: '0.85rem' }}
            >
              <option value="">Semua Status</option>
              <option value="UNPAID_ALL">BELUM BAYAR (Hari Ini + Tunggakan)</option>
              <option value="PAID">TAGIHAN LUNAS</option>
              <option value="TODAY">JATUH TEMPO HARI INI</option>
              <option value="OVERDUE">MENUNGGAK</option>
            </select>

            <select 
              value={monthFilter} 
              onChange={(e) => setMonthFilter(e.target.value)} 
              className="form-select"
              style={{ width: '140px', fontSize: '0.85rem' }}
            >
              <option value="">Semua Bulan</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <button 
              onClick={handleExportCSV} 
              className="action-btn" 
              title="Ekspor CSV Data Penagihan" 
              style={{ 
                border: '1px solid var(--border-color)', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '0.4rem', 
                padding: '0 0.8rem', 
                background: 'rgba(16, 185, 129, 0.1)', 
                color: '#10b981', 
                borderColor: 'rgba(16, 185, 129, 0.2)',
                borderRadius: '8px',
                height: '38px',
                fontSize: '0.85rem',
                fontWeight: '600'
              }}
            >
              <Download size={16} />
              <span>Ekspor CSV</span>
            </button>

            <button onClick={fetchInvoices} className="action-btn" title="Refresh Tabel" style={{ border: '1px solid var(--border-color)' }}>
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)' }}>
            <RefreshCw size={28} className="animate-spin" style={{ color: 'var(--accent-cyan)' }} />
            <p style={{ marginTop: '0.75rem', fontSize: '0.9rem' }}>Memuat data tagihan...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: '2rem', fontWeight: '500' }}>Error: {error}</p>
        ) : invoices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '4rem 0', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>Tidak ada data tagihan yang sesuai filter.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Pelanggan</th>
                  <th>Kontak & Tempo</th>
                  <th>Bulan Tagihan</th>
                  <th>Paket Internet</th>
                  <th style={{ textAlign: 'right', paddingRight: '2rem' }}>Nominal</th>
                  <th>Status</th>
                  <th>Metode Bayar</th>
                  <th style={{ textAlign: 'right', width: '160px' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.filter(inv => {
                  if (statusFilter === 'PAID') return inv.status === 'PAID';
                  if (statusFilter === 'OVERDUE') return checkIsOverdue(inv);
                  if (statusFilter === 'TODAY') return checkIsToday(inv);
                  if (statusFilter === 'UNPAID_ALL') return inv.status === 'UNPAID';
                  return true;
                }).filter(inv => {
                  if (!wilayahFilter) return true;
                  return inv.customer.wilayah?.toLowerCase().includes(wilayahFilter.toLowerCase());
                }).map((inv) => {
                  const isPaid = inv.status === 'PAID';
                  const isOverdue = checkIsOverdue(inv);
                  return (

                    <tr key={inv.id}>
                      <td>
                        <Link href={`/customers/${inv.customer.id}`} style={{ color: 'var(--text-heading)', fontWeight: '600', textDecoration: 'none' }}>
                          {inv.customer.name}
                        </Link>
                        {inv.customer.wilayah && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-cyan)', marginTop: '0.15rem', fontWeight: '500' }}>
                            Wilayah: {inv.customer.wilayah}
                          </span>
                        )}
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                          ID: {inv.customer.id.substring(0, 8)}...
                        </span>
                      </td>
                      <td>
                        <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                          WA: {inv.customer.phone}
                        </span>
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-cyan)', fontWeight: '500' }}>
                          Tempo: Tgl {inv.customer.dueDate}
                        </span>
                      </td>
                      <td style={{ fontWeight: '500', color: 'var(--text-heading)' }}>{inv.month}</td>
                      <td>
                        <span style={{ background: 'rgba(139, 92, 246, 0.08)', border: '1px solid rgba(139, 92, 246, 0.15)', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.85rem', fontWeight: '500', display: 'inline-block' }}>
                          {inv.customer.package?.name || '-'}
                        </span>
                      </td>
                      <td style={{ 
                        fontWeight: '700', 
                        textAlign: 'right', 
                        paddingRight: '2rem',
                        color: isPaid ? 'var(--accent-teal)' : 'var(--accent-rose)',
                        transition: 'color 0.2s ease'
                      }}>
                        {formatRupiah(inv.amount - (inv.discount || 0))}
                        {inv.discount > 0 && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: '500', marginTop: '0.15rem' }}>
                            (Disc: -{formatRupiah(inv.discount)})
                          </span>
                        )}
                      </td>
                      <td>
                        <span className={`badge ${isPaid ? 'badge-active' : (isOverdue ? 'badge-suspended' : 'badge-grace')}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', background: isPaid ? '' : (isOverdue ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)'), color: isPaid ? '' : (isOverdue ? '#ef4444' : '#d97706'), border: isPaid ? '' : (isOverdue ? '1px solid rgba(239, 68, 68, 0.2)' : '1px solid rgba(245, 158, 11, 0.2)') }}>
                          {isPaid ? <CheckCircle size={12} /> : (isOverdue ? <AlertTriangle size={12} /> : <Clock size={12} />)}
                          {isPaid ? 'LUNAS' : (isOverdue ? 'MENUNGGAK' : (checkIsToday(inv) ? 'HARI INI' : 'BELUM BAYAR'))}
                        </span>
                        {!isPaid && inv.promiseDate && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: '600', marginTop: '0.25rem' }}>
                            Janji: {new Date(inv.promiseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                          </span>
                        )}
                      </td>

                      <td>
                        {isPaid && (
                          <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600', background: 'rgba(255,255,255,0.03)', padding: '0.25rem 0.5rem', borderRadius: '4px', border: '1px solid var(--border-color)', display: 'inline-block', marginBottom: '0.25rem' }}>
                            {inv.paymentMethod}
                          </span>
                        )}
                        {inv.notes && (
                          <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic', maxWidth: '160px', wordBreak: 'break-word' }}>
                            Catatan: {inv.notes}
                          </span>
                        )}
                        {!isPaid && !inv.notes && (
                          <span style={{ color: 'var(--text-muted)' }}>-</span>
                        )}
                      </td>
                      <td style={{ width: '160px' }}>
                        <div className="table-actions" style={{ justifyContent: 'flex-end', width: '100%' }}>
                          <Link href={`/billing/${inv.id}/print`} target="_blank" className="action-btn" title="Cetak Invoice/Kwitansi" style={{ color: 'var(--accent-purple)' }}>
                            <Printer size={18} />
                          </Link>
                          {!isPaid && (
                            <>
                              <Link href={getWhatsAppLink(inv)} target="_blank" className="action-btn" title="Kirim Tagihan WhatsApp" style={{ color: 'var(--accent-teal)' }}>
                                <MessageSquare size={18} />
                              </Link>
                              <button onClick={() => {
                                setPayInvoiceId(inv.id);
                                setPayAmount((inv.amount - (inv.discount || 0)).toString());
                                setRollover(true);
                              }} className="action-btn" title="Rekam Pembayaran" style={{ color: 'var(--accent-cyan)' }}>
                                <Check size={18} />
                              </button>
                            </>
                          )}
                          <button onClick={() => handleDeleteInvoice(inv.id)} className="action-btn delete" title="Hapus Tagihan">
                            <Trash2 size={18} />
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
      </section>
    </>
  );
}
