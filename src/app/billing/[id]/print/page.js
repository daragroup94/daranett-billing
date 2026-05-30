'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Printer, ArrowLeft, RefreshCw, CheckCircle2, AlertCircle, Download } from 'lucide-react';

export default function PrintInvoicePage() {
  const { id } = useParams();
  const router = useRouter();
  const [invoice, setInvoice] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  const handleExportPDF = async () => {
    try {
      setPdfLoading(true);
      const html2pdf = (await import('html2pdf.js')).default;
      const element = document.querySelector('.print-container');
      const opt = {
        margin:       10,
        filename:     `INV-${month}-${id.substring(0, 5).toUpperCase()}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2.5, useCORS: true, logging: false },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
      };
      await html2pdf().from(element).set(opt).save();
    } catch (err) {
      console.error('Gagal mengekspor PDF:', err);
      alert('Gagal mengekspor PDF. Silakan coba cetak manual.');
    } finally {
      setPdfLoading(false);
    }
  };

  useEffect(() => {
    const fetchInvoice = async () => {
      try {
        setLoading(true);
        setError(null);
        const res = await fetch(`/api/billing/${id}`);
        if (!res.ok) {
          throw new Error('Gagal memuat data tagihan');
        }
        const data = await res.json();
        setInvoice(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (id) {
      fetchInvoice();
    }
  }, [id]);

  useEffect(() => {
    if (invoice) {
      const timer = setTimeout(() => {
        window.print();
      }, 800);
      return () => clearTimeout(timer);
    }
  }, [invoice]);

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return '-';
    return new Date(dateStr).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
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
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', gap: '1rem', fontFamily: 'var(--font-sans)' }}>
        <RefreshCw className="animate-spin" size={32} style={{ color: '#0ea5e9' }} />
        <p style={{ color: '#94a3b8', fontWeight: '500' }}>Menyiapkan dokumen cetak...</p>
      </div>
    );
  }

  if (error || !invoice) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '100vh', background: '#0b0f19', color: '#f8fafc', gap: '1.5rem', textAlign: 'center', padding: '2rem', fontFamily: 'var(--font-sans)' }}>
        <AlertCircle size={48} style={{ color: '#f43f5e' }} />
        <div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: '700' }}>Gagal Memuat</h2>
          <p style={{ color: '#94a3b8' }}>{error || 'Tagihan tidak ditemukan'}</p>
        </div>
        <button onClick={() => window.close()} className="btn btn-secondary" style={{ background: 'rgba(255,255,255,0.05)', color: '#fff' }}>
          Tutup Halaman
        </button>
      </div>
    );
  }

  const { customer, amount, discount, status, month, paymentMethod, paymentDate, createdAt } = invoice;

  return (
    <div style={{ background: '#fff', color: '#1e293b', minHeight: '100vh', padding: '20px', fontFamily: 'var(--font-sans)', WebkitPrintColorAdjust: 'exact', printColorAdjust: 'exact' }}>
      
      {/* Printable CSS style override */}
      <style jsx global>{`
        body {
          background-color: #fff !important;
          color: #1e293b !important;
          font-family: var(--font-sans) !important;
        }
        @media print {
          .no-print {
            display: none !important;
          }
          body {
            padding: 0 !important;
            margin: 0 !important;
          }
          .print-container {
            border: none !important;
            box-shadow: none !important;
            padding: 0 !important;
            max-width: 100% !important;
          }
        }
      `}</style>

      {/* Action Bar (Hidden during printing) */}
      <div className="no-print" style={{ 
        maxWidth: '800px', 
        margin: '0 auto 25px auto', 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        background: '#f8fafc', 
        padding: '12px 20px', 
        borderRadius: '12px', 
        border: '1px solid #e2e8f0' 
      }}>
        <button 
          onClick={() => window.close()} 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '8px', 
            background: '#fff', 
            border: '1px solid #e2e8f0', 
            padding: '8px 16px', 
            borderRadius: '8px', 
            cursor: 'pointer',
            fontWeight: '600',
            color: '#475569',
            fontFamily: 'var(--font-sans)',
            fontSize: '0.9rem',
            transition: 'all 0.2s'
          }}
        >
          <ArrowLeft size={16} /> Tutup Tab
        </button>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button 
            onClick={handleExportPDF} 
            disabled={pdfLoading}
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: '#0284c7', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(2, 132, 199, 0.25)',
              transition: 'all 0.2s',
              opacity: pdfLoading ? 0.7 : 1
            }}
          >
            {pdfLoading ? (
              <RefreshCw className="animate-spin" size={16} />
            ) : (
              <Download size={16} />
            )}
            {pdfLoading ? 'Membuat PDF...' : 'Unduh PDF'}
          </button>
          <button 
            onClick={() => window.print()} 
            style={{ 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '8px', 
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', 
              color: '#fff', 
              border: 'none', 
              padding: '10px 20px', 
              borderRadius: '8px', 
              cursor: 'pointer',
              fontWeight: '700',
              fontFamily: 'var(--font-sans)',
              fontSize: '0.9rem',
              boxShadow: '0 4px 12px rgba(139, 92, 246, 0.25)',
              transition: 'all 0.2s'
            }}
          >
            <Printer size={16} /> Cetak Sekarang
          </button>
        </div>
      </div>

      {/* Invoice Printable Document Sheet */}
      <div className="print-container" style={{ 
        maxWidth: '800px', 
        margin: '0 auto', 
        background: '#fff', 
        border: '1px solid #f1f5f9', 
        boxShadow: '0 10px 25px -5px rgba(0,0,0,0.02), 0 8px 10px -6px rgba(0,0,0,0.02)', 
        padding: '50px', 
        borderRadius: '16px',
        position: 'relative'
      }}>
        
        {/* Paid Stamp watermark */}
        {status === 'PAID' && (
          <div style={{ 
            position: 'absolute', 
            top: '45px', 
            right: '50px', 
            border: '3px solid #10b981', 
            color: '#047857', 
            background: '#ecfdf5',
            textTransform: 'uppercase', 
            fontSize: '1.15rem', 
            fontWeight: '800', 
            padding: '8px 20px', 
            borderRadius: '8px', 
            transform: 'rotate(-3deg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
            letterSpacing: '1px',
            boxShadow: '0 4px 6px -1px rgba(16, 185, 129, 0.05)'
          }}>
            <CheckCircle2 size={18} /> LUNAS
          </div>
        )}

        {/* Unpaid Stamp watermark */}
        {status === 'UNPAID' && (
          <div style={{ 
            position: 'absolute', 
            top: '45px', 
            right: '50px', 
            border: '3px solid #ef4444', 
            color: '#b91c1c', 
            background: '#fef2f2',
            textTransform: 'uppercase', 
            fontSize: '1.15rem', 
            fontWeight: '800', 
            padding: '8px 20px', 
            borderRadius: '8px', 
            transform: 'rotate(-3deg)',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            zIndex: 10,
            letterSpacing: '1px',
            boxShadow: '0 4px 6px -1px rgba(239, 68, 68, 0.05)'
          }}>
            BELUM BAYAR
          </div>
        )}

        {/* Corporate Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '2px solid #f8fafc', paddingBottom: '25px', marginBottom: '30px' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)', display: 'flex', alignItems: 'center', justifyItems: 'center', justifyContent: 'center', color: '#fff', fontWeight: '800', fontSize: '1rem' }}>D</div>
              <h1 style={{ fontSize: '1.75rem', fontWeight: '800', color: '#0f172a', margin: '0', letterSpacing: '-0.5px' }}>DaraNet ISP</h1>
            </div>
            <p style={{ margin: '0', fontSize: '0.85rem', color: '#64748b', lineHeight: '1.5' }}>
              RTRW Net Professional High-Speed Fiber Internet<br />
              Jl. Dara Utama No. 12, Kota Jakarta<br />
              WhatsApp Support: 0812-3456-7890<br />
              Website: www.daranet.net.id
            </p>
          </div>
          <div style={{ textAlign: 'right', alignSelf: 'flex-end' }}>
            <h2 style={{ fontSize: '1.25rem', fontWeight: '800', color: '#4f46e5', margin: '0 0 6px 0', letterSpacing: '-0.3px' }}>
              {status === 'PAID' ? 'KUITANSI PEMBAYARAN' : 'INVOICE TAGIHAN'}
            </h2>
            <p style={{ margin: '0', fontSize: '0.8rem', color: '#94a3b8', fontWeight: '600', fontFamily: 'monospace', letterSpacing: '0.5px' }}>
              No: INV-{month}-{id.substring(0, 5).toUpperCase()}
            </p>
          </div>
        </div>

        {/* Transaction Metadata Summary Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '25px', marginBottom: '35px' }}>
          {/* Customer profile */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '0.75rem', color: '#828fa3', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0', fontWeight: '800' }}>
              DITAGIHKAN KEPADA:
            </h3>
            <strong style={{ display: 'block', fontSize: '1.05rem', color: '#0f172a', marginBottom: '6px' }}>{customer.name}</strong>
            <div style={{ fontSize: '0.85rem', color: '#475569', lineHeight: '1.5' }}>
              <span>No. HP/WA: {customer.phone}</span><br />
              <span>Alamat: {customer.address}</span><br />
              {customer.ipAddress && <span>Static IP: {customer.ipAddress}</span>}
              {customer.ipAddress && customer.pppoeUsername && <br />}
              {customer.pppoeUsername && <span>PPPoE Secret: {customer.pppoeUsername}</span>}
            </div>
          </div>

          {/* Billing details */}
          <div style={{ background: '#f8fafc', padding: '20px', borderRadius: '12px', border: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '0.75rem', color: '#828fa3', textTransform: 'uppercase', letterSpacing: '1px', margin: '0 0 10px 0', fontWeight: '800' }}>
              RINCIAN TAGIHAN:
            </h3>
            <table style={{ width: '100%', fontSize: '0.85rem', color: '#475569', borderCollapse: 'collapse' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '4px 0', color: '#64748b' }}>Bulan Tagihan:</td>
                  <td style={{ padding: '4px 0', fontWeight: '700', textAlign: 'right', color: '#0f172a' }}>{getReadableMonth(month)}</td>
                </tr>
                <tr>
                  <td style={{ padding: '4px 0', color: '#64748b' }}>Tanggal Terbit:</td>
                  <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatDate(createdAt).substring(0, 12)}</td>
                </tr>
                {status === 'UNPAID' ? (
                  <tr>
                    <td style={{ padding: '4px 0', color: '#64748b' }}>Jatuh Tempo:</td>
                    <td style={{ padding: '4px 0', fontWeight: '700', color: '#ef4444', textAlign: 'right' }}>
                      Tgl {customer.dueDate} pukul {customer.dueTime || '10:00'}
                    </td>
                  </tr>
                ) : (
                  <>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Tanggal Bayar:</td>
                      <td style={{ padding: '4px 0', textAlign: 'right' }}>{formatDate(paymentDate)}</td>
                    </tr>
                    <tr>
                      <td style={{ padding: '4px 0', color: '#64748b' }}>Metode Bayar:</td>
                      <td style={{ padding: '4px 0', fontWeight: '700', textAlign: 'right', color: '#0f172a' }}>{paymentMethod || 'CASH'}</td>
                    </tr>
                  </>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Invoice Item Breakdown Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '35px' }}>
          <thead>
            <tr style={{ background: '#f8fafc', borderBottom: '2px solid #cbd5e1' }}>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: '800', textAlign: 'left', color: '#475569', letterSpacing: '0.5px' }}>LAYANAN / DESKRIPSI</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: '800', textAlign: 'center', color: '#475569', width: '120px', letterSpacing: '0.5px' }}>BANDWIDTH</th>
              <th style={{ padding: '12px 16px', fontSize: '0.8rem', fontWeight: '800', textAlign: 'right', color: '#475569', width: '180px', letterSpacing: '0.5px' }}>HARGA</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #e2e8f0' }}>
              <td style={{ padding: '18px 16px', fontSize: '0.9rem', lineHeight: '1.5' }}>
                <strong style={{ color: '#0f172a', display: 'block', fontSize: '0.95rem', marginBottom: '4px' }}>Langganan Internet DaraNet ISP</strong>
                <span style={{ fontSize: '0.75rem', color: '#64748b', fontWeight: '500' }}>
                  Periode Bulan {getReadableMonth(month)} • Paket: {customer.package?.name || 'Custom Package'}
                </span>
              </td>
              <td style={{ padding: '18px 16px', fontSize: '0.9rem', textAlign: 'center', color: '#475569', fontWeight: '600' }}>
                {customer.package ? `${customer.package.speedDownload} Mbps` : '-'}
              </td>
              <td style={{ padding: '18px 16px', fontSize: '0.95rem', textAlign: 'right', color: '#0f172a', fontWeight: '700' }}>
                {formatRupiah(amount)}
              </td>
            </tr>
          </tbody>
        </table>

        {/* Summary Breakdown block */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '45px' }}>
          <div style={{ width: '300px' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9rem' }}>
              <tbody>
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: '500' }}>Subtotal:</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a', fontWeight: '600' }}>{formatRupiah(amount)}</td>
                </tr>
                {discount > 0 && (
                  <tr>
                    <td style={{ padding: '6px 0', color: '#f43f5e', fontWeight: '500' }}>Potongan Pelanggan:</td>
                    <td style={{ padding: '6px 0', textAlign: 'right', color: '#f43f5e', fontWeight: '600' }}>-{formatRupiah(discount)}</td>
                  </tr>
                )}
                <tr>
                  <td style={{ padding: '6px 0', color: '#64748b', fontWeight: '500' }}>Biaya Admin / PPN:</td>
                  <td style={{ padding: '6px 0', textAlign: 'right', color: '#0f172a', fontWeight: '600' }}>Rp 0</td>
                </tr>
                <tr style={{ borderTop: '2px solid #4f46e5', fontSize: '1.05rem', fontWeight: '800' }}>
                  <td style={{ padding: '12px 0', color: '#0f172a' }}>TOTAL TAGIHAN:</td>
                  <td style={{ padding: '12px 0', textAlign: 'right', color: '#4f46e5', fontSize: '1.15rem' }}>{formatRupiah(amount - (discount || 0))}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer & Notes */}
        <div style={{ borderTop: '1px dashed #cbd5e1', paddingTop: '25px', display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '40px' }}>
          <div>
            <h4 style={{ fontSize: '0.8rem', fontWeight: '800', color: '#334155', margin: '0 0 8px 0', letterSpacing: '0.5px' }}>KETERANGAN & CATATAN:</h4>
            <ul style={{ margin: '0', paddingLeft: '15px', fontSize: '0.75rem', color: '#64748b', lineHeight: '1.5' }}>
              <li>Kuitansi/Invoice ini adalah dokumen sah dari DaraNet ISP.</li>
              <li>Pembayaran yang sudah terekam tidak dapat dibatalkan atau dikembalikan.</li>
              <li>Simpan lembar bukti pembayaran ini untuk verifikasi masa mendatang bila diperlukan.</li>
              <li>Terima kasih telah mempercayakan koneksi internet Anda kepada **DaraNet ISP**.</li>
            </ul>
          </div>

          {/* Signature fields */}
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'space-between', height: '130px', textAlign: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#64748b', fontWeight: '500' }}>
              Petugas Kasir DaraNet,
            </span>
            <div style={{ width: '130px', borderBottom: '1px solid #475569', margin: '15px 0 6px 0' }}></div>
            <strong style={{ fontSize: '0.75rem', color: '#0f172a', letterSpacing: '0.3px' }}>DaraNet Billing System</strong>
          </div>
        </div>

      </div>
    </div>
  );
}
