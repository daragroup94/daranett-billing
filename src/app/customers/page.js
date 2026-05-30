'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { 
  Users, 
  Search, 
  Filter, 
  MessageSquare, 
  Edit, 
  Trash2, 
  RefreshCw, 
  Wifi,
  Phone,
  MapPin,
  Clock,
  Eye
} from 'lucide-react';

export default function CustomersPage() {
  const [customers, setCustomers] = useState([]);
  const [packages, setPackages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Filter States
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [packageFilter, setPackageFilter] = useState('');

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [resCustomers, resPackages] = await Promise.all([
        fetch('/api/customers'),
        fetch('/api/packages')
      ]);

      if (!resCustomers.ok || !resPackages.ok) {
        throw new Error('Gagal memuat data dari server');
      }

      const custData = await resCustomers.json();
      const pkgData = await resPackages.json();

      setCustomers(custData);
      setPackages(pkgData);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleDelete = async (id, name) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus pelanggan "${name}"? Seluruh riwayat tagihan pelanggan ini juga akan dihapus secara permanen.`)) return;

    try {
      const res = await fetch(`/api/customers/${id}`, {
        method: 'DELETE'
      });

      if (!res.ok) {
        const result = await res.json();
        throw new Error(result.error || 'Gagal menghapus pelanggan');
      }

      fetchData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Filter logic
  const filteredCustomers = customers.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.phone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.address.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (c.ipAddress && c.ipAddress.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (c.pppoeUsername && c.pppoeUsername.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === '' || c.status === statusFilter;
    const matchesPackage = packageFilter === '' || c.packageId === packageFilter;

    return matchesSearch && matchesStatus && matchesPackage;
  });

  const formatRupiah = (val) => {
    return new Intl.NumberFormat('id-ID', {
      style: 'currency',
      currency: 'IDR',
      maximumFractionDigits: 0
    }).format(val);
  };

  const getWhatsAppLink = (customer) => {
    const formattedPhone = customer.phone.replace(/[^0-9]/g, '');
    let cleanPhone = formattedPhone;
    if (formattedPhone.startsWith('0')) {
      cleanPhone = '62' + formattedPhone.substring(1);
    }
    
    const monthNames = ["Januari", "Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November", "Desember"];
    const currentMonth = monthNames[new Date().getMonth()] + " " + new Date().getFullYear();
    const message = `Halo Bpk/Ibu *${customer.name}*,\n\nKami dari *DaraNet ISP* menginfokan bahwa tagihan internet bulan *${currentMonth}* sebesar *${formatRupiah(customer.package.price)}* (Paket ${customer.package.name}) akan jatuh tempo pada *tanggal ${customer.dueDate}*.\n\nMohon lakukan pembayaran tepat waktu agar kenyamanan berinternet Anda tetap terjaga.\n\nTerima kasih atas kepercayaannya.\n_DaraNet ISP_`;
    
    return `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodeURIComponent(message)}`;
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Daftar Pelanggan</h1>
          <p>Kelola profil, status isolir, dan detail koneksi jaringan pelanggan DaraNet.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchData} className="btn btn-secondary">
            <RefreshCw size={18} /> Refresh
          </button>
          <Link href="/customers/new" className="btn btn-primary">
            + Tambah Pelanggan
          </Link>
        </div>
      </header>

      {/* Filters Bar */}
      <section className="panel-card" style={{ padding: '1.25rem' }}>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
          
          <div style={{ flex: 1, minWidth: '240px', position: 'relative' }}>
            <Search size={18} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="text" 
              value={searchTerm} 
              onChange={(e) => setSearchTerm(e.target.value)} 
              placeholder="Cari nama, phone, IP, PPPoE..." 
              className="form-input" 
              style={{ paddingLeft: '2.5rem' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Filter size={16} style={{ color: 'var(--text-secondary)' }} />
              <select 
                value={statusFilter} 
                onChange={(e) => setStatusFilter(e.target.value)} 
                className="form-select"
                style={{ width: '150px' }}
              >
                <option value="">Semua Status</option>
                <option value="ACTIVE">ACTIVE</option>
                <option value="GRACE_PERIOD">GRACE PERIOD</option>
                <option value="SUSPENDED">ISOLIR (SUSPENDED)</option>
              </select>
            </div>

            <select 
              value={packageFilter} 
              onChange={(e) => setPackageFilter(e.target.value)} 
              className="form-select"
              style={{ width: '180px' }}
            >
              <option value="">Semua Paket Internet</option>
              {packages.map(pkg => (
                <option key={pkg.id} value={pkg.id}>{pkg.name}</option>
              ))}
            </select>
          </div>

        </div>
      </section>

      {/* Customers List Panel */}
      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <Users size={20} style={{ color: 'var(--accent-cyan)' }} />
            Database Pelanggan ({filteredCustomers.length} dari {customers.length})
          </h2>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
            <RefreshCw size={24} className="animate-spin" />
            <p style={{ marginTop: '0.5rem' }}>Memuat database pelanggan...</p>
          </div>
        ) : error ? (
          <p style={{ color: 'var(--accent-rose)', textAlign: 'center', padding: '2rem' }}>Error: {error}</p>
        ) : filteredCustomers.length === 0 ? (
          <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Tidak ada pelanggan yang cocok dengan pencarian.</p>
        ) : (
          <div className="table-container">
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Pelanggan</th>
                  <th>Alamat & Kontak</th>
                  <th>Paket Internet</th>
                  <th>Jatuh Tempo</th>
                  <th>IP / PPPoE</th>
                  <th>Status</th>
                  <th style={{ textAlign: 'right' }}>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredCustomers.map((cust) => (
                  <tr key={cust.id}>
                    <td>
                      <Link href={`/customers/${cust.id}`} style={{ color: '#fff', fontWeight: '600', textDecoration: 'none', fontSize: '1.05rem' }}>
                        {cust.name}
                      </Link>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                        ID: {cust.id.substring(0, 8)}...
                      </span>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: '#fff', fontSize: '0.85rem', marginBottom: '0.2rem' }}>
                        <Phone size={12} style={{ color: 'var(--accent-teal)' }} />
                        {cust.phone}
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                        <MapPin size={12} style={{ color: 'var(--accent-rose)' }} />
                        {cust.address.length > 30 ? cust.address.substring(0, 28) + '...' : cust.address}
                      </div>
                    </td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: '600' }}>
                        <Wifi size={16} style={{ color: 'var(--accent-cyan)' }} />
                        {cust.package?.name || '-'}
                      </div>
                      <span style={{ display: 'block', fontSize: '0.75rem', color: 'var(--accent-teal)', fontWeight: '600', marginTop: '0.15rem' }}>
                        {formatRupiah(cust.package?.price || 0)}
                      </span>
                    </td>
                    <td style={{ fontWeight: '500' }}>
                      <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                        <Clock size={14} style={{ color: 'var(--accent-cyan)' }} />
                        Tgl {cust.dueDate}
                      </span>
                    </td>
                    <td>
                      {cust.ipAddress && (
                        <span style={{ display: 'block', fontFamily: 'monospace', fontSize: '0.85rem', color: 'var(--accent-purple)' }}>
                          IP: {cust.ipAddress}
                        </span>
                      )}
                      {cust.pppoeUsername ? (
                        <span style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                          User: {cust.pppoeUsername}
                        </span>
                      ) : !cust.ipAddress ? (
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>-</span>
                      ) : null}
                    </td>
                    <td>
                      <span className={`badge ${
                        cust.status === 'ACTIVE' ? 'badge-active' : 
                        cust.status === 'SUSPENDED' ? 'badge-suspended' : 'badge-grace'
                      }`}>
                        {cust.status === 'ACTIVE' ? 'ACTIVE' : 
                         cust.status === 'SUSPENDED' ? 'ISOLIR' : 'GRACE'}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions" style={{ justifyContent: 'flex-end' }}>
                        <Link href={getWhatsAppLink(cust)} target="_blank" className="action-btn" title="Kirim Pengingat WhatsApp" style={{ color: 'var(--accent-teal)' }}>
                          <MessageSquare size={18} />
                        </Link>
                        <Link href={`/customers/${cust.id}`} className="action-btn" title="Lihat Detail & Tagihan">
                          <Eye size={18} />
                        </Link>
                        <button onClick={() => handleDelete(cust.id, cust.name)} className="action-btn delete" title="Hapus Pelanggan">
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
