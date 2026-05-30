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
  Printer
} from 'lucide-react';

export default function BillingPage() {
  const [invoices, setInvoices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [monthFilter, setMonthFilter] = useState('');
  
  // Invoice Generation state
  const [generateMonth, setGenerateMonth] = useState('');
  const [generating, setGenerating] = useState(false);
  const [genResult, setGenResult] = useState(null);

  // Payment Recording State
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);

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
      if (monthFilter) queryParams.append('month', monthFilter);
      if (statusFilter) queryParams.append('status', statusFilter);
      if (searchTerm) queryParams.append('search', searchTerm);

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
    const currentVal = new Date().toISOString().substring(0, 7);
    setMonthFilter(currentVal);
    setGenerateMonth(currentVal);
  }, []);

  useEffect(() => {
    if (monthFilter !== '') {
      fetchInvoices();
    }
  }, [monthFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchInvoices();
  };

  const handleGenerateInvoices = async (e) => {
    e.preventDefault();
    if (!generateMonth) return;
    
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
      const res = await fetch(`/api/billing/${payInvoiceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          status: 'PAID',
          paymentMethod: payMethod
        })
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal merekam pembayaran');
      }

      setPayInvoiceId(null);
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

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
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

    const message = `Halo Bpk/Ibu *${inv.customer.name}*,\n\nKami dari *DaraNet ISP* menginfokan bahwa tagihan internet bulan *${readableMonth}* sebesar *${formatRupiah(inv.amount)}* sudah terbit.\n\nStatus tagihan saat ini: *BELUM LUNAS*.\nJatuh tempo pembayaran pada *tanggal ${inv.customer.dueDate}*.\n\nPembayaran dapat ditransfer ke rekening DaraNet atau dibayar tunai ke petugas kami.\n\nTerima kasih.\n_DaraNet ISP_`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Keuangan & Tagihan Bulanan</h1>
          <p>Menerbitkan tagihan massal, merekam pembayaran pelanggan, dan memantau kolektibilitas DaraNet.</p>
        </div>
      </header>

      <section className="content-row">
        {/* Bulk Billing Generator Panel */}
        <div className="panel-card" style={{ flex: 1 }}>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Calendar size={18} style={{ color: 'var(--accent-purple)' }} />
              Penerbitan Tagihan Bulanan (Bulk)
            </h2>
          </div>

          <form onSubmit={handleGenerateInvoices} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Fitur ini akan secara otomatis menerbitkan tagihan senilai harga paket internet kepada semua pelanggan berstatus <strong>ACTIVE</strong> atau <strong>GRACE PERIOD</strong> yang belum memiliki tagihan pada bulan yang dipilih.
            </p>

            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
              <div style={{ flex: 1 }}>
                <label className="form-label">Pilih Bulan Tagihan</label>
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

              <button type="submit" className="btn btn-primary" style={{ alignSelf: 'flex-end' }} disabled={generating}>
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
                background: genResult.success ? 'rgba(16, 185, 129, 0.05)' : 'rgba(244, 63, 94, 0.05)', 
                border: `1px solid ${genResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)'}`, 
                padding: '1rem', 
                borderRadius: 'var(--radius-sm)',
                fontSize: '0.85rem',
                color: genResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)',
                display: 'flex',
                alignItems: 'flex-start',
                gap: '0.5rem'
              }}>
                <AlertTriangle size={16} style={{ marginTop: '0.1rem' }} />
                <div>
                  <strong>{genResult.success ? 'Sukses!' : 'Gagal!'}</strong>
                  <p style={{ marginTop: '0.2rem', color: 'var(--text-primary)' }}>{genResult.message}</p>
                  {genResult.success && (
                    <ul style={{ marginLeft: '1rem', marginTop: '0.25rem', color: 'var(--text-secondary)' }}>
                      <li>Tagihan baru dibuat: {genResult.generated} pelanggan</li>
                      <li>Dilewati (sudah ada): {genResult.skipped} pelanggan</li>
                    </ul>
                  )}
                </div>
              </div>
            )}
          </form>
        </div>

        {/* Invoice Collector stats summary */}
        <div className="panel-card" style={{ flex: 1 }}>
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <DollarSign size={18} style={{ color: 'var(--accent-teal)' }} />
              Ikhtisar Colection Rate
            </h2>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', height: '100%', justifyContent: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Bulan Terpilih</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: '#fff' }}>{monthFilter || '-'}</strong>
              </div>
              <div style={{ textAlign: 'right' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Kolektibilitas</span>
                <strong style={{ display: 'block', fontSize: '1.25rem', color: 'var(--accent-teal)' }}>
                  {invoices.length > 0 
                    ? Math.round((invoices.filter(i => i.status === 'PAID').length / invoices.length) * 100) 
                    : 0}%
                </strong>
              </div>
            </div>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Lunas Terbayar:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-teal)' }}>
                  {formatRupiah(invoices.filter(i => i.status === 'PAID').reduce((s, i) => s + (i.amount - (i.discount || 0)), 0))}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.85rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Belum Terbayar:</span>
                <span style={{ fontWeight: '600', color: 'var(--accent-rose)' }}>
                  {formatRupiah(invoices.filter(i => i.status === 'UNPAID').reduce((s, i) => s + (i.amount - (i.discount || 0)), 0))}
                </span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Interactive Payment Recording modal in-page overlay */}
      {payInvoiceId && (
        <section className="panel-card" style={{ border: '1px solid var(--accent-teal)', background: 'rgba(16, 185, 129, 0.03)' }}>
          <div className="panel-header">
            <h2 className="panel-title" style={{ color: 'var(--accent-teal)' }}>Proses Pembayaran Tagihan</h2>
            <button onClick={() => setPayInvoiceId(null)} className="action-btn">
              <Check size={20} />
            </button>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', alignItems: 'center' }}>
            <div style={{ flex: 1, minWidth: '200px' }}>
              <label className="form-label">Pilih Metode Pembayaran</label>
              <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="form-select">
                <option value="CASH">CASH (Tunai)</option>
                <option value="TRANSFER">BANK TRANSFER (Mandiri/BCA/BRI)</option>
                <option value="QRIS">QRIS / e-Wallet (Gopay/OVO/Dana)</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '1rem', alignSelf: 'flex-end', marginTop: '1rem' }}>
              <button onClick={() => setPayInvoiceId(null)} className="btn btn-secondary">Batal</button>
              <button onClick={handleProcessPayment} className="btn btn-success" disabled={payLoading}>
                {payLoading ? 'Mencatat...' : 'Konfirmasi Pembayaran Lunas'}
              </button>
            </div>
          </div>
        </section>
      )}

      {/* Invoices Database Panel */}
      <section className="panel-card">
        <div className="panel-header" style={{ flexWrap: 'wrap', gap: '1rem' }}>
          <h2 className="panel-title">Daftar Tagihan Pelanggan ({invoices.length})</h2>
          
          {/* Query Filters */}
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', alignItems: 'center' }}>
            
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

            <select 
              value={statusFilter} 
              onChange={(e) => setStatusFilter(e.target.value)} 
              className="form-select"
              style={{ width: '130px', fontSize: '0.85rem' }}
            >
              <option value="">Semua Status</option>
              <option value="PAID">LUNAS</option>
              <option value="UNPAID">BELUM BAYAR</option>
            </select>

            <select 
              value={monthFilter} 
              onChange={(e) => setMonthFilter(e.target.value)} 
              className="form-select"
              style={{ width: '130px', fontSize: '0.85rem' }}
            >
              <option value="">Semua Bulan</option>
              {months.map(m => (
                <option key={m} value={m}>{m}</option>
              ))}
            </select>

            <button onClick={fetchInvoices} className="action-btn" title="Refresh">
              <RefreshCw size={18} />
            </button>
          </div>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" />
            <p style={{ marginTop: '0.5rem' }}>Memuat data tagihan...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: '2rem' }}>Error: {error}</p>
        ) : invoices.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Tidak ada data tagihan yang sesuai filter.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Nama Pelanggan</th>
                  <th>Kontak & Tempo</th>
                  <th>Bulan Tagihan</th>
                  <th>Paket Internet</th>
                  <th>Nominal</th>
                  <th>Status</th>
                  <th>Metode Bayar</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {invoices.map((inv) => (
                  <tr key={inv.id}>
                    <td>
                      <Link href={`/customers/${inv.customer.id}`} style={{ color: '#fff', fontWeight: '600', textDecoration: 'none' }}>
                        {inv.customer.name}
                      </Link>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        ID: {inv.customer.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '0.2rem' }}>
                        WA: {inv.customer.phone}
                      </span>
                      <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--accent-cyan)' }}>
                        Tempo: Tgl {inv.customer.dueDate}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500', color: '#fff' }}>{inv.month}</td>
                    <td>{inv.customer.package?.name || '-'}</td>
                    <td style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>
                      {formatRupiah(inv.amount - (inv.discount || 0))}
                      {inv.discount > 0 && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: '500', marginTop: '0.15rem' }}>
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
                        <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', fontWeight: '600' }}>
                          {inv.paymentMethod}
                        </span>
                      ) : (
                        <span style={{ color: 'var(--text-muted)' }}>-</span>
                      )}
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link href={`/billing/${inv.id}/print`} target="_blank" className="action-btn" title="Cetak Invoice/Kwitansi" style={{ color: 'var(--accent-purple)' }}>
                          <Printer size={18} />
                        </Link>
                        {inv.status === 'UNPAID' && (
                          <>
                            <Link href={getWhatsAppLink(inv)} target="_blank" className="action-btn" title="Kirim Tagihan WhatsApp" style={{ color: 'var(--accent-teal)' }}>
                              <MessageSquare size={18} />
                            </Link>
                            <button onClick={() => setPayInvoiceId(inv.id)} className="action-btn" title="Rekam Pembayaran" style={{ color: 'var(--accent-cyan)' }}>
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
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </>
  );
}
