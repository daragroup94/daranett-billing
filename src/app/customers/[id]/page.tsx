'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Wifi, 
  Phone, 
  MapPin, 
  Clock, 
  FileText, 
  Check, 
  X, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Lock, 
  DollarSign, 
  AlertTriangle,
  Save,
  MessageSquare,
  Calendar,
  Printer
} from 'lucide-react';

export default function CustomerDetailPage() {
  const router = useRouter();
  const { id } = useParams();

  const [customer, setCustomer] = useState(null);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Edit State
  const [editMode, setEditMode] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    phone: '',
    address: '',
    wilayah: '',
    ipAddress: '',
    pppoeUsername: '',
    pppoePassword: '',
    dueDate: '5',
    dueTime: '10:00',
    discount: '0',
    status: 'ACTIVE',
    packageId: '',
    joinDate: ''
  });
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Payment State
  const [payInvoiceId, setPayInvoiceId] = useState(null);
  const [payMethod, setPayMethod] = useState('CASH');
  const [payLoading, setPayLoading] = useState(false);
  const [payAmount, setPayAmount] = useState('');
  const [rollover, setRollover] = useState(true);
  const [payNotes, setPayNotes] = useState('');
  const [promiseDateStr, setPromiseDateStr] = useState('');

  const fetchCustomerData = async () => {
    try {
      setLoading(true);
      setError(null);

      const [resCust, resPkgs] = await Promise.all([
        fetch(`/api/customers/${id}`),
        fetch('/api/packages')
      ]);

      if (resCust.status === 404) {
        throw new Error('Pelanggan tidak ditemukan');
      }

      if (!resCust.ok || !resPkgs.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const custData = await resCust.json();
      const pkgsData = await resPkgs.json();

      setCustomer(custData);
      setPackages(pkgsData);
      
      // Populate Edit Form
      setEditForm({
        name: custData.name,
        phone: custData.phone,
        address: custData.address,
        wilayah: custData.wilayah || '',
        ipAddress: custData.ipAddress || '',
        pppoeUsername: custData.pppoeUsername || '',
        pppoePassword: custData.pppoePassword || '',
        dueDate: custData.dueDate.toString(),
        dueTime: custData.dueTime || '10:00',
        discount: custData.discount ? custData.discount.toString() : '0',
        status: custData.status,
        packageId: custData.packageId,
        joinDate: custData.joinDate ? new Date(custData.joinDate).toISOString().substring(0, 10) : ''
      });
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCustomerData();
  }, [id]);

  useEffect(() => {
    if (payInvoiceId && customer && customer.invoices) {
      const selectedInvoice = customer.invoices.find(inv => inv.id === payInvoiceId);
      if (selectedInvoice) {
        if (selectedInvoice.promiseDate) {
          setPromiseDateStr(new Date(selectedInvoice.promiseDate).toISOString().substring(0, 10));
        } else {
          setPromiseDateStr('');
        }
        setPayNotes(selectedInvoice.notes || '');
      }
    } else {
      setPromiseDateStr('');
    }
  }, [payInvoiceId, customer]);

  const handleEditChange = (e) => {
    const { name, value } = e.target;
    setEditForm(prev => ({ ...prev, [name]: value }));
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveError(null);

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editForm)
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      setEditMode(false);
      fetchCustomerData();
    } catch (err) {
      setSaveError(err.message);
    } finally {
      setSaveLoading(false);
    }
  };

  const handleProcessPayment = async () => {
    setPayLoading(true);
    try {
      const selectedInvoice = customer.invoices.find(inv => inv.id === payInvoiceId);
      const invoiceTotal = selectedInvoice ? selectedInvoice.amount - (selectedInvoice.discount || 0) : 0;
      const unpaidInvoices = customer.invoices.filter(inv => inv.status === 'UNPAID');
      const customerTotalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
      const customerUnpaidCount = unpaidInvoices.length;
      const amountPaid = parseFloat(payAmount);

      const payload: Record<string, any> = {
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
      fetchCustomerData();
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
      fetchCustomerData();
    } catch (err) {
      alert(err.message);
    } finally {
      setPayLoading(false);
    }
  };

  const handleDeleteInvoice = async (invId) => {
    if (!confirm('Apakah Anda yakin ingin menghapus tagihan ini?')) return;

    try {
      const res = await fetch(`/api/billing/${invId}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        throw new Error('Gagal menghapus tagihan');
      }

      fetchCustomerData();
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

  const getWhatsAppLink = (cust) => {
    const formattedPhone = cust.phone.replace(/[^0-9]/g, '');
    let cleanPhone = formattedPhone;
    if (formattedPhone.startsWith('0')) {
      cleanPhone = '62' + formattedPhone.substring(1);
    }
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonth = monthNames[new Date().getMonth()] + " " + new Date().getFullYear();
    const message = `Halo Bpk/Ibu *${cust.name}*,\n\nKami dari *DaraNet ISP* menginfokan tagihan bulanan internet Anda sebesar *${formatRupiah(cust.package.price)}* (Paket ${cust.package.name}).\n\nSilakan abaikan pesan ini jika Anda sudah melunasi. Hubungi Admin jika butuh bantuan.\n\nTerima kasih.\n_DaraNet ISP_`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat data profil pelanggan...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1.5rem', textAlign: 'center' }}>
        <AlertTriangle size={48} style={{ color: 'var(--accent-rose)' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Error</h2>
          <p style={{ color: 'var(--text-secondary)' }}>{error}</p>
        </div>
        <Link href="/customers" className="btn btn-secondary">
          <ArrowLeft size={18} /> Kembali ke Daftar Pelanggan
        </Link>
      </div>
    );
  }

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.5rem' }}>
            <Link href="/customers" className="action-btn" style={{ background: 'var(--hover-overlay)', padding: '0.5rem', borderRadius: 'var(--radius-sm)' }}>
              <ArrowLeft size={18} />
            </Link>
            <h1>Detail Pelanggan: {customer.name}</h1>
          </div>
          <p>ID Pelanggan: {customer.id}</p>
        </div>
        <div className="header-actions">
          <Link href={getWhatsAppLink(customer)} target="_blank" className="btn btn-secondary" style={{ color: 'var(--accent-teal)', borderColor: 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' }}>
            <MessageSquare size={18} /> Hubungi WhatsApp
          </Link>
          {!editMode && (
            <button onClick={() => setEditMode(true)} className="btn btn-primary">
              <Edit3 size={18} /> Edit Profil
            </button>
          )}
        </div>
      </header>

      <section className="content-row">
        {/* Customer Information Panel */}
        <div className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 className="panel-title">{editMode ? 'Edit Informasi Pelanggan' : 'Profil Pelanggan'}</h2>
            {editMode && (
              <button onClick={() => setEditMode(false)} className="action-btn" title="Batal Edit">
                <X size={20} />
              </button>
            )}
          </div>

          {editMode ? (
            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
              {saveError && (
                <div style={{ background: 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', border: '1px solid var(--accent-rose)', padding: '1rem', borderRadius: 'var(--radius-sm)', color: 'var(--accent-rose)', fontSize: '0.9rem' }}>
                  {saveError}
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Nama Lengkap *</label>
                  <input type="text" name="name" value={editForm.name} onChange={handleEditChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">No. WhatsApp / HP *</label>
                  <input type="text" name="phone" value={editForm.phone} onChange={handleEditChange} className="form-input" required />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Alamat Lengkap *</label>
                  <textarea name="address" value={editForm.address} onChange={handleEditChange} className="form-textarea" rows={2} required />
                </div>
                <div className="form-group" style={{ maxWidth: '250px' }}>
                  <label className="form-label">Tanggal Aktif / Gabung *</label>
                  <input type="date" name="joinDate" value={editForm.joinDate} onChange={handleEditChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Wilayah / Rute Penagihan</label>
                  <input type="text" name="wilayah" value={editForm.wilayah} onChange={handleEditChange} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Static IP Address</label>
                  <input type="text" name="ipAddress" value={editForm.ipAddress} onChange={handleEditChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">PPPoE Username</label>
                  <input type="text" name="pppoeUsername" value={editForm.pppoeUsername} onChange={handleEditChange} className="form-input" />
                </div>
                <div className="form-group">
                  <label className="form-label">PPPoE Password</label>
                  <input type="password" name="pppoePassword" value={editForm.pppoePassword} onChange={handleEditChange} className="form-input" />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Paket Langganan *</label>
                  <select name="packageId" value={editForm.packageId} onChange={handleEditChange} className="form-select">
                    {packages.map(pkg => (
                      <option key={pkg.id} value={pkg.id}>{pkg.name} - Rp {pkg.price.toLocaleString('id-ID')}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Status Koneksi *</label>
                  <select name="status" value={editForm.status} onChange={handleEditChange} className="form-select">
                    <option value="ACTIVE">AKTIF (Koneksi Aktif)</option>
                    <option value="SUSPENDED">NONAKTIF (Koneksi Nonaktif)</option>
                  </select>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label className="form-label">Tanggal Jatuh Tempo *</label>
                  <select name="dueDate" value={editForm.dueDate} onChange={handleEditChange} className="form-select">
                    {Array.from({ length: 31 }, (_, i) => i + 1).map(day => (
                      <option key={day} value={day.toString()}>Setiap Tanggal {day}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Jam Jatuh Tempo *</label>
                  <input type="time" name="dueTime" value={editForm.dueTime} onChange={handleEditChange} className="form-input" required />
                </div>
                <div className="form-group">
                  <label className="form-label">Potongan Bulanan (Rp)</label>
                  <input type="number" name="discount" value={editForm.discount} onChange={handleEditChange} className="form-input" min="0" />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
                <button type="button" onClick={() => setEditMode(false)} className="btn btn-secondary">Batal</button>
                <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                  {saveLoading ? <RefreshCw className="animate-spin" size={18} /> : <Save size={18} />} Simpan Perubahan
                </button>
              </div>
            </form>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.75rem' }}>
              
              {/* Profile Card Summary */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1.5rem', background: 'var(--hover-overlay)', border: '1px solid var(--border-color)', padding: '1.25rem', borderRadius: 'var(--radius-sm)' }}>
                <div style={{ display: 'flex', flex: 1, flexDirection: 'column', gap: '0.85rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span className={`badge ${
                      customer.status === 'ACTIVE' ? 'badge-active' : 'badge-suspended'
                    }`}>
                      {customer.status === 'ACTIVE' ? 'AKTIF' : 'NONAKTIF'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <Phone size={16} style={{ color: 'var(--accent-teal)' }} />
                    <strong>WhatsApp:</strong> {customer.phone}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'start', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <MapPin size={16} style={{ color: 'var(--accent-rose)', marginTop: '0.15rem' }} />
                    <div>
                      <strong>Alamat:</strong> {customer.address}
                    </div>
                  </div>

                  {customer.wilayah && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                      <MapPin size={16} style={{ color: 'var(--accent-cyan)' }} />
                      <strong>Wilayah/Rute:</strong> {customer.wilayah}
                    </div>
                  )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', flex: 1, borderLeft: '1px solid var(--border-color)', paddingLeft: '1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <Wifi size={16} style={{ color: 'var(--accent-cyan)' }} />
                    <strong>Paket Langganan:</strong> {customer.package?.name}
                  </div>
                  <div style={{ fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-teal)', marginLeft: '1.5rem' }}>
                    {customer.discount > 0 ? (
                      <>
                        <span style={{ textDecoration: 'line-through', fontSize: '0.95rem', color: 'var(--text-muted)', marginRight: '0.5rem' }}>
                          {formatRupiah(customer.package?.price || 0)}
                        </span>
                        {formatRupiah((customer.package?.price || 0) - customer.discount)}
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', marginLeft: '0.5rem' }}>
                          (Potongan {formatRupiah(customer.discount)})
                        </span>
                      </>
                    ) : (
                      formatRupiah(customer.package?.price || 0)
                    )}
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>/bln</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem' }}>
                    <Clock size={16} style={{ color: 'var(--accent-amber)' }} />
                    <strong>Jatuh Tempo:</strong> Tanggal {customer.dueDate} pukul {customer.dueTime || '10:00'}
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)', fontSize: '0.95rem', marginTop: '0.25rem' }}>
                    <Calendar size={16} style={{ color: 'var(--accent-purple)' }} />
                    <strong>Tanggal Aktif:</strong> {customer.joinDate ? new Date(customer.joinDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' }) : '-'}
                  </div>

                  {customer.carriedOverDebt > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-rose)', fontSize: '0.95rem', marginTop: '0.5rem', padding: '0.4rem 0.6rem', background: 'color-mix(in srgb, var(--accent-rose) 8%, transparent)', borderRadius: '6px', border: '1px dashed var(--accent-rose)', width: 'fit-content' }}>
                      <DollarSign size={16} />
                      <strong>Akumulasi Sisa Kurang Bayar:</strong> {formatRupiah(customer.carriedOverDebt)}
                    </div>
                  )}
                </div>
              </div>

              {/* Technical Network Details */}
              <div>
                <h3 style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <Lock size={18} style={{ color: 'var(--accent-cyan)' }} />
                  Data Konfigurasi Router & IP
                </h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                  <div style={{ background: 'var(--hover-overlay)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Static IP Address</span>
                    <strong style={{ fontFamily: 'monospace', fontSize: '1rem', color: 'var(--accent-purple)' }}>{customer.ipAddress || 'Not Configured'}</strong>
                  </div>

                  <div style={{ background: 'var(--hover-overlay)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>PPPoE Secret Username</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{customer.pppoeUsername || 'Not Configured'}</strong>
                  </div>

                  <div style={{ background: 'var(--hover-overlay)', border: '1px solid var(--border-color)', padding: '1rem', borderRadius: 'var(--radius-sm)' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>PPPoE Secret Password</span>
                    <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>{customer.pppoePassword ? '••••••••' : 'Not Configured'}</strong>
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Customer Invoices Panel */}
        <div className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <FileText size={20} style={{ color: 'var(--accent-cyan)' }} />
              Riwayat Tagihan
            </h2>
          </div>

          {/* Payment Recording Form inside UI */}
          {payInvoiceId && (() => {
            const selectedInvoice = customer.invoices.find(inv => inv.id === payInvoiceId);
            const invoiceTotal = selectedInvoice ? selectedInvoice.amount - (selectedInvoice.discount || 0) : 0;
            const unpaidInvoices = customer.invoices.filter(inv => inv.status === 'UNPAID');
            const customerTotalUnpaid = unpaidInvoices.reduce((sum, inv) => sum + (inv.amount - (inv.discount || 0)), 0);
            const customerUnpaidCount = unpaidInvoices.length;
            
            const totalToPay = customerUnpaidCount > 1 ? customerTotalUnpaid : invoiceTotal;
            const numPaid = parseFloat(payAmount) || 0;
            const isPartial = numPaid < totalToPay;
            const remaining = Math.max(0, totalToPay - numPaid);

            return (
              <div style={{ background: 'color-mix(in srgb, var(--accent-teal) 4%, transparent)', border: '1px solid var(--accent-teal)', padding: '1.25rem', borderRadius: 'var(--radius-sm)', display: 'flex', flexDirection: 'column', gap: '0.75rem', animation: 'fadeIn 0.3s ease-out' }}>
                <h3 style={{ fontSize: '0.95rem', fontWeight: '700', color: 'var(--accent-teal)' }}>Selesaikan Pembayaran</h3>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '1rem', alignItems: 'flex-end' }}>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>
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
                    <div>
                      <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Tagihan Bulan Terpilih ({selectedInvoice?.month})</label>
                      <input type="text" className="form-input" value={formatRupiah(invoiceTotal)} disabled style={{ width: '100%', background: 'var(--hover-overlay)', cursor: 'not-allowed' }} />
                    </div>
                  )}
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Jumlah Dibayar (Rp)</label>
                    <input type="number" className="form-input" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} placeholder="Masukkan jumlah bayar" style={{ width: '100%' }} />
                  </div>
                  <div>
                    <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Metode Pembayaran</label>
                    <select value={payMethod} onChange={(e) => setPayMethod(e.target.value)} className="form-select" style={{ width: '100%' }}>
                      <option value="CASH">CASH (Tunai)</option>
                      <option value="TRANSFER">BANK TRANSFER</option>
                      <option value="QRIS">QRIS / e-Wallet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Catatan Khusus (Keterangan Pembayaran)</label>
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
                    padding: '0.75rem 1rem', 
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.25rem',
                    fontSize: '0.85rem'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span style={{ color: 'var(--text-secondary)' }}>Sisa Hutang:</span>
                      <strong style={{ color: 'var(--accent-rose)' }}>{formatRupiah(remaining)}</strong>
                    </div>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer', color: 'var(--text-primary)', marginTop: '0.2rem' }}>
                      <input 
                        type="checkbox" 
                        checked={rollover} 
                        onChange={(e) => setRollover(e.target.checked)}
                        style={{ width: '14px', height: '14px', cursor: 'pointer' }}
                      />
                      Gabungkan sisa hutang {formatRupiah(remaining)} ini ke tagihan bulan depan
                    </label>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end', marginTop: '0.25rem' }}>
                  <button onClick={() => { setPayInvoiceId(null); setPayNotes(''); }} className="btn btn-secondary" style={{ padding: '0.5rem 1rem' }}>Batal</button>
                  <button onClick={handleProcessPayment} className="btn btn-success" style={{ padding: '0.5rem 1rem', background: 'var(--accent-teal)', border: 'none', color: '#fff' }} disabled={payLoading || numPaid <= 0}>
                    {payLoading ? '...' : (isPartial ? 'Bayar Sebagian' : 'Bayar Lunas')}
                  </button>
                </div>

                <hr style={{ border: '0', borderTop: '1px solid var(--border-color)', margin: '0.5rem 0' }} />
                <div style={{ background: 'rgba(245, 158, 11, 0.04)', border: '1px dashed var(--accent-amber)', padding: '0.75rem 1rem', borderRadius: '8px', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <h4 style={{ fontSize: '0.85rem', fontWeight: '700', color: 'var(--accent-amber)', margin: 0 }}>Atur Janji Bayar (Bila Belum Bisa Bayar)</h4>
                  <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-end', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '150px' }}>
                      <label style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', display: 'block', marginBottom: '0.25rem' }}>Tanggal Janji Bayar</label>
                      <input 
                        type="date" 
                        className="form-input" 
                        value={promiseDateStr} 
                        onChange={(e) => setPromiseDateStr(e.target.value)} 
                        style={{ width: '100%', fontSize: '0.85rem' }} 
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleSavePromiseDate} 
                      className="btn" 
                      style={{ background: 'var(--accent-amber)', color: '#000', border: 'none', height: '38px', padding: '0 1rem', borderRadius: '4px', fontWeight: '600', cursor: 'pointer', fontSize: '0.85rem' }} 
                      disabled={payLoading}
                    >
                      {payLoading ? 'Menyimpan...' : 'Simpan Janji Bayar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxHeight: '450px', overflowY: 'auto', paddingRight: '0.25rem' }}>
            {customer.invoices.length === 0 ? (
              <p style={{ color: 'var(--text-secondary)', textAlign: 'center', padding: '2rem' }}>Belum ada riwayat tagihan terbit.</p>
            ) : (
              customer.invoices.map((inv) => (
                <div key={inv.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem', background: 'var(--hover-overlay)', border: '1px solid var(--border-color)', borderRadius: 'var(--radius-sm)' }}>
                  <div>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>BULAN {inv.month}</span>
                    <strong style={{ display: 'block', fontSize: '1.1rem', color: 'var(--text-heading)', margin: '0.15rem 0' }}>
                      {formatRupiah(inv.amount - (inv.discount || 0))}
                      {inv.discount > 0 && (
                        <span style={{ fontSize: '0.75rem', color: 'var(--accent-rose)', fontWeight: 'normal', marginLeft: '0.5rem' }}>
                          (Potongan {formatRupiah(inv.discount)})
                        </span>
                      )}
                    </strong>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem', marginTop: '0.25rem' }}>
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <span className={`badge ${inv.status === 'PAID' ? 'badge-active' : 'badge-suspended'}`} style={{ fontSize: '0.7rem', padding: '0.1rem 0.5rem' }}>
                          {inv.status === 'PAID' ? 'LUNAS' : 'BELUM BAYAR'}
                        </span>
                        {inv.status === 'PAID' && (
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            via {inv.paymentMethod}
                          </span>
                        )}
                      </div>
                      {inv.status === 'UNPAID' && inv.promiseDate && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-amber)', fontWeight: '600' }}>
                          Janji Bayar: {new Date(inv.promiseDate).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                        </span>
                      )}
                      {inv.notes && (
                        <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                          Catatan: {inv.notes}
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <Link href={`/billing/${inv.id}/print`} target="_blank" className="action-btn" title="Cetak Kwitansi/Invoice" style={{ color: 'var(--accent-purple)', background: 'color-mix(in srgb, var(--accent-purple) 10%, transparent)', padding: '0.5rem', borderRadius: '4px', display: 'flex', alignItems: 'center' }}>
                      <Printer size={16} />
                    </Link>
                    {inv.status === 'UNPAID' && (
                      <button onClick={() => {
                        setPayInvoiceId(inv.id);
                        const unpaid = customer.invoices.filter(i => i.status === 'UNPAID');
                        const total = unpaid.reduce((sum, i) => sum + (i.amount - (i.discount || 0)), 0);
                        setPayAmount(total.toString());
                        setRollover(true);
                      }} className="action-btn" title="Bayar Lunas" style={{ color: 'var(--accent-teal)', background: 'color-mix(in srgb, var(--accent-teal) 10%, transparent)', padding: '0.5rem', borderRadius: '4px' }}>
                        <Check size={18} />
                      </button>
                    )}
                    <button onClick={() => handleDeleteInvoice(inv.id)} className="action-btn delete" title="Hapus Tagihan" style={{ background: 'color-mix(in srgb, var(--accent-rose) 5%, transparent)', padding: '0.5rem', borderRadius: '4px' }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </section>
    </>
  );
}
