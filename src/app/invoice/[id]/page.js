'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { 
  Wifi, 
  CheckCircle, 
  XCircle, 
  Calendar, 
  Phone, 
  MapPin, 
  Download, 
  CreditCard, 
  RefreshCw, 
  ArrowRight,
  TrendingUp
} from 'lucide-react';

export default function PublicInvoicePage() {
  const params = useParams();
  const { id } = params;

  const [invoice, setInvoice] = useState(null);
  const [midtrans, setMidtrans] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [paying, setPaying] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const fetchInvoiceData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/public/invoice/${id}`);
      if (!res.ok) {
        if (res.status === 404) {
          throw new Error('Tagihan tidak ditemukan atau URL salah.');
        }
        throw new Error('Gagal memuat detail tagihan.');
      }
      const data = await res.json();
      setInvoice(data.invoice);
      setMidtrans(data.midtrans);
      if (data.invoice.status === 'PAID') {
        setPaymentSuccess(true);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id) {
      fetchInvoiceData();
    }
  }, [id]);

  // Load Midtrans Snap Script dynamically if configured
  useEffect(() => {
    if (midtrans && midtrans.configured && midtrans.snapToken) {
      const snapScriptUrl = midtrans.isProduction
        ? 'https://app.midtrans.com/snap/snap.js'
        : 'https://app.sandbox.midtrans.com/snap/snap.js';

      const scriptId = 'midtrans-snap-script';
      let script = document.getElementById(scriptId);

      if (!script) {
        script = document.createElement('script');
        script.src = snapScriptUrl;
        script.id = scriptId;
        script.setAttribute('data-client-key', midtrans.clientKey);
        document.body.appendChild(script);
      }

      return () => {
        // Clean up script if component unmounts
        // Usually, we can keep it, but it is fine to keep
      };
    }
  }, [midtrans]);

  const handleOnlinePayment = () => {
    if (!midtrans || !midtrans.snapToken) return;

    if (window.snap) {
      setPaying(true);
      window.snap.pay(midtrans.snapToken, {
        onSuccess: function (result) {
          console.log('[Midtrans] Payment success:', result);
          setPaymentSuccess(true);
          setInvoice(prev => prev ? { ...prev, status: 'PAID', paymentMethod: result.payment_type?.toUpperCase() || 'MIDTRANS' } : null);
          setPaying(false);
        },
        onPending: function (result) {
          console.log('[Midtrans] Payment pending:', result);
          alert('Pembayaran sedang diproses. Silakan selesaikan pembayaran Anda.');
          setPaying(false);
        },
        onError: function (result) {
          console.error('[Midtrans] Payment error:', result);
          alert('Pembayaran gagal. Silakan coba lagi.');
          setPaying(false);
        },
        onClose: function () {
          console.log('[Midtrans] Customer closed the popup without finishing the payment');
          setPaying(false);
        }
      });
    } else {
      alert('Pustaka pembayaran Midtrans sedang dimuat. Silakan tunggu beberapa detik dan klik tombol lagi.');
    }
  };

  const handleSimulatePayment = async () => {
    if (paying) return;
    setPaying(true);

    try {
      const res = await fetch(`/api/public/invoice/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paymentMethod: 'SIMULATED_QRIS' })
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || 'Simulasi pembayaran gagal');
      }

      setPaymentSuccess(true);
      setInvoice(prev => prev ? { ...prev, status: 'PAID', paymentMethod: 'SIMULATED_QRIS' } : null);
    } catch (err) {
      alert(err.message);
    } finally {
      setPaying(false);
    }
  };

  const handleDownloadPDF = () => {
    // Dynamically load html2pdf.js client-side
    const element = document.getElementById('invoice-card');
    if (!element) return;

    const opt = {
      margin:       [0.5, 0.5, 0.5, 0.5],
      filename:     `Invoice_DaraNet_${invoice.customer.name}_${invoice.month}.pdf`,
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true, backgroundColor: '#0f172a' },
      jsPDF:        { unit: 'in', format: 'letter', orientation: 'portrait' }
    };

    // Load and run html2pdf
    import('html2pdf.js').then((html2pdf) => {
      html2pdf.default().set(opt).from(element).save();
    }).catch(err => {
      console.error('Failed to load html2pdf:', err);
      alert('Gagal memuat modul PDF. Silakan coba lagi.');
    });
  };

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getReadableMonth = (monthStr) => {
    if (!monthStr) return '';
    const [year, month] = monthStr.split('-');
    const monthNames = [
      "Januari", "Februari", "Maret", "April", "Mei", "Juni",
      "Juli", "Agustus", "September", "Oktober", "November", "Desember"
    ];
    return `${monthNames[parseInt(month) - 1]} ${year}`;
  };

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-heading)',
        gap: '1rem',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat invoice pelanggan DaraNet...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '100vh',
        width: '100vw',
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 9999,
        backgroundColor: 'var(--bg-primary)',
        color: 'var(--text-heading)',
        padding: '2rem',
        textAlign: 'center',
        gap: '1.5rem',
        fontFamily: "'Outfit', sans-serif"
      }}>
        <XCircle size={64} style={{ color: 'var(--accent-rose)' }} />
        <div>
          <h2 style={{ fontSize: '1.8rem', fontWeight: '800', marginBottom: '0.5rem' }}>Terjadi Kesalahan</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '450px', margin: '0 auto' }}>{error || 'Data tagihan tidak dapat ditemukan.'}</p>
        </div>
      </div>
    );
  }

  const billTotal = invoice.amount - (invoice.discount || 0);

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      width: '100vw',
      height: '100vh',
      zIndex: 9999,
      backgroundColor: 'var(--bg-primary)',
      color: 'var(--text-primary)',
      overflowY: 'auto',
      padding: '2rem 1rem',
      fontFamily: "'Outfit', sans-serif",
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.05) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.05) 0px, transparent 50%)
      `
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        
        {/* Header Actions */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={{
              background: 'var(--gradient-primary)',
              color: '#fff',
              width: '42px',
              height: '42px',
              borderRadius: '12px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontWeight: '800',
              fontSize: '1.3rem',
              boxShadow: '0 0 15px rgba(14, 165, 233, 0.3)'
            }}>
              D
            </div>
            <div>
              <h2 style={{ fontSize: '1.25rem', fontWeight: '800', margin: 0, letterSpacing: '0.5px', color: 'var(--text-heading)' }}>DARANETT</h2>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', margin: 0, letterSpacing: '1px', textTransform: 'uppercase' }}>ISP & RTRW NET</p>
            </div>
          </div>
          <button onClick={handleDownloadPDF} className="btn btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--hover-overlay)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}>
            <Download size={18} /> Unduh PDF
          </button>
        </div>

        {/* Invoice Card */}
        <div id="invoice-card" style={{
          background: 'var(--glass-bg)',
          backdropFilter: 'blur(20px)',
          border: '1px solid var(--border-color)',
          borderRadius: '24px',
          padding: '2.5rem',
          boxShadow: 'var(--shadow-lg)',
          display: 'flex',
          flexDirection: 'column',
          gap: '2.5rem'
        }}>
          {/* Top Invoice Row */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
            <div>
              <span style={{
                color: 'var(--accent-cyan)',
                fontSize: '0.75rem',
                textTransform: 'uppercase',
                letterSpacing: '2px',
                fontWeight: '700',
                display: 'block',
                marginBottom: '0.35rem'
              }}>
                Invoice Tagihan
              </span>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', margin: 0, letterSpacing: '-0.5px', color: 'var(--text-heading)' }}>#{invoice.id.substring(0, 8).toUpperCase()}</h1>
              <span style={{ display: 'block', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                Bulan Layanan: <strong>{getReadableMonth(invoice.month)}</strong>
              </span>
            </div>
            
            <div style={{ textAlign: 'right' }}>
              <span className={`badge ${paymentSuccess ? 'badge-active' : 'badge-suspended'}`} style={{
                fontSize: '0.95rem',
                padding: '0.5rem 1.25rem',
                borderRadius: '12px',
                fontWeight: '700',
                boxShadow: paymentSuccess ? '0 0 15px rgba(16, 185, 129, 0.2)' : '0 0 15px rgba(244, 63, 94, 0.2)'
              }}>
                {paymentSuccess ? 'LUNAS' : 'BELUM BAYAR'}
              </span>
              {paymentSuccess && invoice.paymentMethod && (
                <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Metode: {invoice.paymentMethod}
                </span>
              )}
            </div>
          </div>

          <hr style={{ border: '0', borderTop: '1px solid var(--glass-border)' }} />

          {/* Customer & Technical Details */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '2rem' }}>
            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: '700' }}>Tujuan Penagihan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <strong style={{ fontSize: '1.1rem', color: 'var(--text-heading)' }}>{invoice.customer.name}</strong>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                  <Phone size={14} style={{ color: 'var(--accent-cyan)' }} />
                  {invoice.customer.phone}
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: '1.4' }}>
                  <MapPin size={14} style={{ color: 'var(--accent-rose)', marginTop: '0.25rem', flexShrink: 0 }} />
                  <span>{invoice.customer.address}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: '700' }}>Detail Koneksi Jaringan</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                  <Wifi size={18} style={{ color: 'var(--accent-cyan)' }} />
                  {invoice.customer.package.name} ({invoice.customer.package.speedDownload} Mbps)
                </div>
                {invoice.customer.pppoeUsername && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    Username PPPoE: <code style={{ color: 'var(--accent-purple)' }}>{invoice.customer.pppoeUsername}</code>
                  </span>
                )}
                {invoice.customer.ipAddress && (
                  <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                    IP Address: <code style={{ color: 'var(--accent-purple)' }}>{invoice.customer.ipAddress}</code>
                  </span>
                )}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '0.25rem' }}>
                  <Calendar size={14} style={{ color: 'var(--accent-cyan)' }} />
                  <span>Jatuh Tempo: Setiap Tanggal <strong>{invoice.customer.dueDate}</strong> (Pukul {invoice.customer.dueTime})</span>
                </div>
              </div>
            </div>
          </div>

          {/* Pricing Table */}
          <div style={{ marginTop: '1rem' }}>
            <h3 style={{ fontSize: '0.9rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '0.75rem', fontWeight: '700' }}>Rincian Tagihan</h3>
            <div style={{ background: 'var(--input-bg)', borderRadius: '16px', border: '1px solid var(--glass-border)', overflow: 'hidden' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.95rem' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)', background: 'var(--hover-overlay)' }}>
                    <th style={{ textAlign: 'left', padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Layanan</th>
                    <th style={{ textAlign: 'right', padding: '1rem', color: 'var(--text-secondary)', fontWeight: '600' }}>Nominal</th>
                  </tr>
                </thead>
                <tbody>
                  <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                    <td style={{ padding: '1rem' }}>
                      <strong>Paket Internet {invoice.customer.package.name}</strong>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.15rem' }}>Bandwidth {invoice.customer.package.speedDownload} Mbps Download / {invoice.customer.package.speedUpload} Mbps Upload</span>
                    </td>
                    <td style={{ textAlign: 'right', padding: '1rem', fontWeight: '600' }}>{formatRupiah(invoice.amount)}</td>
                  </tr>
                  {invoice.discount > 0 && (
                    <tr style={{ borderBottom: '1px solid var(--glass-border)' }}>
                      <td style={{ padding: '1rem', color: 'var(--accent-rose)' }}>
                        Potongan Biaya Khusus / Diskon
                      </td>
                      <td style={{ textAlign: 'right', padding: '1rem', fontWeight: '600', color: 'var(--accent-rose)' }}>
                        -{formatRupiah(invoice.discount)}
                      </td>
                    </tr>
                  )}
                  <tr style={{ background: 'var(--hover-overlay)' }}>
                    <td style={{ padding: '1.25rem 1rem', fontSize: '1.1rem', fontWeight: '800' }}>Total Yang Harus Dibayar</td>
                    <td style={{ textAlign: 'right', padding: '1.25rem 1rem', fontSize: '1.2rem', fontWeight: '800', color: 'var(--accent-cyan)' }}>
                      {formatRupiah(billTotal)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            
            {invoice.notes && (
              <div style={{ 
                marginTop: '1.25rem', 
                padding: '1rem', 
                background: 'rgba(255,255,255,0.02)', 
                border: '1px dashed var(--border-color)', 
                borderRadius: '12px',
                fontSize: '0.85rem',
                color: 'var(--text-secondary)'
              }}>
                <strong>Catatan:</strong>
                <p style={{ marginTop: '0.25rem', fontStyle: 'italic', margin: 0 }}>{invoice.notes}</p>
              </div>
            )}
          </div>
        </div>

        {/* Payment Methods / Action Section */}
        {!paymentSuccess && (
          <div style={{
            background: 'var(--glass-bg)',
            border: '1px solid var(--border-color)',
            borderRadius: '24px',
            padding: '2rem',
            display: 'flex',
            flexDirection: 'column',
            gap: '1.5rem'
          }}>
            <h3 style={{ fontSize: '1.1rem', fontWeight: '800', margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-heading)' }}>
              <CreditCard size={20} style={{ color: 'var(--accent-cyan)' }} /> Metode Pembayaran Tersedia
            </h3>

            {midtrans && midtrans.configured && midtrans.snapToken ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', alignItems: 'center', padding: '1rem 0' }}>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', textAlign: 'center', margin: 0, maxWidth: '500px' }}>
                  Pembayaran online instan via **QRIS, GoPay, OVO, ShopeePay, Virtual Account Bank (BCA, Mandiri, BNI, BRI)** tersedia untuk tagihan ini.
                </p>
                <button 
                  onClick={handleOnlinePayment}
                  disabled={paying}
                  style={{
                    background: 'linear-gradient(135deg, #10b981, #059669)',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '12px',
                    padding: '1rem 2rem',
                    fontSize: '1.05rem',
                    fontWeight: '700',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    boxShadow: '0 4px 15px rgba(16, 185, 129, 0.25)',
                    transition: 'var(--transition-smooth)'
                  }}
                  onMouseEnter={(e) => {
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 6px 20px rgba(16, 185, 129, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = '0 4px 15px rgba(16, 185, 129, 0.25)';
                  }}
                >
                  {paying ? (
                    <>
                      <RefreshCw className="animate-spin" size={20} /> Membuka Gateway Pembayaran...
                    </>
                  ) : (
                    <>
                      Bayar Sekarang Online <ArrowRight size={20} />
                    </>
                  )}
                </button>
              </div>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '2rem' }}>
                {/* Manual Bank Instructions */}
                <div style={{ flex: 1, minWidth: '280px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: 0 }}>
                    Silakan transfer pembayaran sebesar <strong>{formatRupiah(billTotal)}</strong> ke salah satu rekening bank DaraNet di bawah ini:
                  </p>
                  
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ background: 'var(--hover-overlay)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '14px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.2rem' }}>Bank Mandiri</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontFamily: 'monospace' }}>131-00-1234567-8</strong>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>a.n. DaraNet ISP Nusantara</span>
                    </div>

                    <div style={{ background: 'var(--hover-overlay)', border: '1px solid var(--glass-border)', padding: '1rem', borderRadius: '14px' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.2rem' }}>Bank BCA</span>
                      <strong style={{ fontSize: '1.1rem', color: 'var(--text-heading)', fontFamily: 'monospace' }}>805-4567-123</strong>
                      <span style={{ display: 'block', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '0.2rem' }}>a.n. DaraGroup Nusantara</span>
                    </div>
                  </div>

                  <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', margin: 0 }}>
                    *Harap kirimkan bukti transfer pembayaran Anda ke WhatsApp admin DaraNet setelah transfer berhasil agar dapat segera divalidasi.
                  </p>
                </div>

                </div>
            )}
          </div>
        )}

        {/* Footer info */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', paddingBottom: '3rem' }}>
          <span>Butuh bantuan terkait layanan internet Anda? Hubungi Layanan Pelanggan DaraNet.</span>
          <span>DaraNet ISP Nusantara &copy; {new Date().getFullYear()}</span>
        </div>

      </div>
    </div>
  );
}
