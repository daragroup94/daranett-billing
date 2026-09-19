'use client';

import { useState, useEffect } from 'react';
import { 
  Lock, 
  Monitor, 
  RefreshCw, 
  CheckCircle,
  AlertTriangle,
  Eye,
  EyeOff,
  Info,
  Server,
  Globe,
  CreditCard,
  Activity,
  Trash2,
  Palette,
  Check,
  Sparkles
} from 'lucide-react';
import { THEMES } from '@/lib/themes';

export default function PengaturanPage() {
  const [activeTab, setActiveTab] = useState('password');
  
  // Settings State
  const [settings, setSettings] = useState({
    mikrotikHost: '',
    mikrotikPort: 80,
    mikrotikUsername: '',
    mikrotikPassword: '',
    mikrotikIsolirProfile: 'ISOLIR',
    midtransServerKey: '',
    midtransClientKey: '',
    midtransIsProduction: false,
    cronToken: ''
  });
  
  // Loading and alerts
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [saveLoading, setSaveLoading] = useState(false);
  const [saveResult, setSaveResult] = useState(null);

  // Change Password state
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [passwordResult, setPasswordResult] = useState(null);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Audit Logs State
  const [logs, setLogs] = useState([]);
  const [loadingLogs, setLoadingLogs] = useState(false);
  const [clearingLogs, setClearingLogs] = useState(false);

  const fetchSettings = async () => {
    try {
      setLoadingSettings(true);
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings({
          mikrotikHost: data.mikrotikHost || '',
          mikrotikPort: data.mikrotikPort || 80,
          mikrotikUsername: data.mikrotikUsername || '',
          mikrotikPassword: data.mikrotikPassword || '',
          mikrotikIsolirProfile: data.mikrotikIsolirProfile || 'ISOLIR',
          midtransServerKey: data.midtransServerKey || '',
          midtransClientKey: data.midtransClientKey || '',
          midtransIsProduction: !!data.midtransIsProduction,
          cronToken: data.cronToken || ''
        });
      }
    } catch (err) {
      console.error('Gagal mengambil pengaturan:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const fetchLogs = async () => {
    try {
      setLoadingLogs(true);
      const res = await fetch('/api/logs');
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (err) {
      console.error('Gagal mengambil log:', err);
    } finally {
      setLoadingLogs(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  useEffect(() => {
    if (activeTab === 'logs') {
      fetchLogs();
    }
  }, [activeTab]);

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveLoading(true);
    setSaveResult(null);

    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings)
      });

      if (!res.ok) throw new Error('Gagal menyimpan pengaturan.');
      const data = await res.json();
      setSaveResult({ success: true, message: 'Pengaturan berhasil disimpan!' });
      setTimeout(() => setSaveResult(null), 3000);
    } catch (err) {
      setSaveResult({ success: false, message: err.message });
    } finally {
      setSaveLoading(false);
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPasswordResult(null);

    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setPasswordResult({ success: false, message: 'Semua field wajib diisi.' });
      return;
    }

    if (passwordForm.newPassword.length < 4) {
      setPasswordResult({ success: false, message: 'Password baru minimal 4 karakter.' });
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordResult({ success: false, message: 'Password baru dan konfirmasi password tidak cocok.' });
      return;
    }

    setPasswordLoading(true);
    try {
      const res = await fetch('/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword,
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengganti password');
      setPasswordResult({ success: true, message: data.message || 'Password berhasil diubah!' });
      setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
      setTimeout(() => setPasswordResult(null), 3000);
    } catch (err) {
      setPasswordResult({ success: false, message: err.message });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleClearLogs = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua log aktivitas sistem? Tindakan ini tidak dapat dibatalkan.')) return;

    setClearingLogs(true);
    try {
      const res = await fetch('/api/logs', { method: 'DELETE' });
      if (res.ok) {
        setLogs([]);
        alert('Log berhasil dibersihkan!');
      }
    } catch (err) {
      alert('Gagal membersihkan log');
    } finally {
      setClearingLogs(false);
    }
  };

  const generateCronToken = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let token = '';
    for (let i = 0; i < 24; i++) {
      token += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    setSettings(prev => ({ ...prev, cronToken: token }));
  };

  const [currentTheme, setCurrentTheme] = useState('dark');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setCurrentTheme(localStorage.getItem('daranett-theme') || 'dark');
    }
  }, []);

  const handleSelectTheme = (themeId: string) => {
    setCurrentTheme(themeId);
    localStorage.setItem('daranett-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  };

  const tabs = [
    { id: 'password', label: 'Ganti Password', icon: Lock },
    { id: 'tema', label: 'Tema & Tampilan', icon: Palette },
    { id: 'mikrotik', label: 'Mikrotik Router', icon: Server },
    { id: 'midtrans', label: 'Midtrans Payment', icon: CreditCard },
    { id: 'cron', label: 'Otomatisasi Cron', icon: Globe },
    { id: 'logs', label: 'Log Aktivitas', icon: Activity },
    { id: 'sistem', label: 'Sistem Info', icon: Monitor },
  ];

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat pengaturan sistem...</p>
      </div>
    );
  }

  const getLogBadgeColor = (action) => {
    if (action.includes('SUCCESS')) return 'badge-active';
    if (action.includes('ERROR') || action.includes('NOT_FOUND')) return 'badge-suspended';
    return 'badge-grace';
  };

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Pengaturan Sistem</h1>
          <p>Konfigurasi Mikrotik Router, Midtrans payment gateway, cron scheduler, dan keamanan akun.</p>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="settings-tabs" style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '1.5rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
        {tabs.map((tab) => {
          const Icon = tab.icon;
          return (
            <button 
              key={tab.id}
              className={`settings-tab ${activeTab === tab.id ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.6rem 1.2rem',
                borderRadius: 'var(--radius-sm)',
                background: activeTab === tab.id ? 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)' : 'transparent',
                border: 'none',
                color: activeTab === tab.id ? 'var(--accent-cyan)' : 'var(--text-secondary)',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.3s ease'
              }}
            >
              <Icon size={16} />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Content: Ganti Password */}
      {activeTab === 'password' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Lock size={20} style={{ color: 'var(--accent-cyan)' }} /> Ganti Password Admin
            </h2>
          </div>

          <form onSubmit={handleChangePassword} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Ubah password login admin Anda. Pastikan menggunakan password yang kuat dan mudah diingat. Setelah berhasil diubah, gunakan password baru untuk login berikutnya.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxWidth: '480px' }}>
              <div className="form-group">
                <label className="form-label">Password Saat Ini</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showCurrentPassword ? 'text' : 'password'} 
                    placeholder="Masukkan password saat ini" 
                    value={passwordForm.currentPassword} 
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '3rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                    style={{ 
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', padding: '0.25rem'
                    }}
                  >
                    {showCurrentPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showNewPassword ? 'text' : 'password'} 
                    placeholder="Masukkan password baru (min. 4 karakter)" 
                    value={passwordForm.newPassword} 
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '3rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPassword(!showNewPassword)}
                    style={{ 
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', padding: '0.25rem'
                    }}
                  >
                    {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Konfirmasi Password Baru</label>
                <div style={{ position: 'relative' }}>
                  <input 
                    type={showConfirmPassword ? 'text' : 'password'} 
                    placeholder="Ketik ulang password baru" 
                    value={passwordForm.confirmPassword} 
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="form-input"
                    style={{ width: '100%', paddingRight: '3rem' }}
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={{ 
                      position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)',
                      display: 'flex', alignItems: 'center', padding: '0.25rem'
                    }}
                  >
                    {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>
            </div>

            {passwordResult && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                background: passwordResult.success ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
                border: `1px solid ${passwordResult.success ? 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
                color: passwordResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)', 
                fontSize: '0.85rem', fontWeight: '500',
                maxWidth: '480px'
              }}>
                {passwordResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {passwordResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={passwordLoading}>
                {passwordLoading ? <RefreshCw className="animate-spin" size={16} /> : <Lock size={16} />} Ubah Password
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab Content: Tema & Tampilan */}
      {activeTab === 'tema' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', marginBottom: '1.25rem' }}>
            <div>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Palette size={20} style={{ color: 'var(--accent-cyan)' }} /> Tema &amp; Estetika Tampilan
              </h2>
              <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                Sesuaikan skema warna dan ambient visual DaraNet sesuai kenyamanan mata dan gaya Anda.
              </p>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1.75rem' }}>
            {THEMES.map((t) => {
              const isSelected = currentTheme === t.id;
              return (
                <div
                  key={t.id}
                  onClick={() => handleSelectTheme(t.id)}
                  style={{
                    background: isSelected ? 'var(--hover-overlay-strong)' : 'var(--hover-overlay)',
                    border: isSelected ? `2px solid ${t.accent}` : '1px solid var(--border-color)',
                    borderRadius: '16px',
                    padding: '1.1rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.75rem',
                    transition: 'all 0.25s ease',
                    boxShadow: isSelected ? `0 8px 24px ${t.accent}25` : 'none',
                    position: 'relative'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.bg, border: '1px solid rgba(255,255,255,0.2)' }} title="Background" />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.cardBg, border: '1px solid rgba(255,255,255,0.2)' }} title="Card Background" />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.accent }} title="Accent 1" />
                      <div style={{ width: 20, height: 20, borderRadius: '50%', background: t.accent2 }} title="Accent 2" />
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <span style={{ 
                        fontSize: '0.7rem', 
                        fontWeight: 700, 
                        padding: '2px 8px', 
                        borderRadius: '12px', 
                        background: t.type === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                        color: 'var(--text-secondary)' 
                      }}>
                        {t.type === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
                      </span>
                      {isSelected && (
                        <span style={{ 
                          fontSize: '0.7rem', 
                          fontWeight: 700, 
                          padding: '2px 9px', 
                          borderRadius: '12px', 
                          background: t.accent, 
                          color: '#ffffff',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px'
                        }}>
                          <Check size={11} /> Aktif
                        </span>
                      )}
                    </div>
                  </div>

                  <div>
                    <strong style={{ fontSize: '1rem', color: isSelected ? t.accent : 'var(--text-heading)', display: 'block' }}>
                      {t.name}
                    </strong>
                    <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                      {t.description}
                    </p>
                  </div>

                  {/* Visual Preview Box */}
                  <div style={{
                    background: t.bg,
                    borderRadius: '10px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    border: `1px solid ${t.border}`
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: t.accent }} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 600, color: t.type === 'dark' ? '#f1f5f9' : '#0f172a' }}>
                        DaraNet ISP
                      </span>
                    </div>
                    <span style={{ fontSize: '0.7rem', color: t.accent, fontWeight: 700 }}>
                      PRATINJAU
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Theme Live Sandbox Preview */}
          <div style={{
            background: 'var(--hover-overlay)',
            border: '1px solid var(--border-color)',
            borderRadius: 'var(--radius-md)',
            padding: '1.25rem'
          }}>
            <h3 style={{ margin: '0 0 0.85rem 0', fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-heading)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <Sparkles size={16} style={{ color: 'var(--accent-cyan)' }} />
              Pratinjau Elemen UI Tema Terpilih
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', alignItems: 'center' }}>
              <button className="btn btn-primary">Tombol Primary</button>
              <button className="btn btn-secondary">Tombol Secondary</button>
              <span className="badge badge-active">Status Aktif</span>
              <span className="badge badge-grace">Grace Period</span>
              <span className="badge badge-suspended">Isolir</span>
            </div>
          </div>
        </section>
      )}

      {/* Tab Content: Mikrotik Config */}
      {activeTab === 'mikrotik' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Server size={20} style={{ color: 'var(--accent-purple)' }} /> Integrasi Mikrotik Router (RouterOS REST API)
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Konfigurasikan koneksi API Mikrotik Anda untuk memutus (isolir) PPPoE Secret secara otomatis saat pelanggan menunggak pembayaran lebih dari 3 hari, serta mengaktifkan koneksi kembali secara real-time setelah tagihan dibayar.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Router IP / Host Address</label>
                <input 
                  type="text" 
                  placeholder="Contoh: 192.168.88.1 atau router.daranet.net" 
                  value={settings.mikrotikHost} 
                  onChange={(e) => setSettings(prev => ({ ...prev, mikrotikHost: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Router REST API Port</label>
                <input 
                  type="number" 
                  placeholder="Default HTTP: 80, HTTPS: 443" 
                  value={settings.mikrotikPort} 
                  onChange={(e) => setSettings(prev => ({ ...prev, mikrotikPort: parseInt(e.target.value) || 80 }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Username</label>
                <input 
                  type="text" 
                  placeholder="admin" 
                  value={settings.mikrotikUsername} 
                  onChange={(e) => setSettings(prev => ({ ...prev, mikrotikUsername: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">API Password</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={settings.mikrotikPassword} 
                  onChange={(e) => setSettings(prev => ({ ...prev, mikrotikPassword: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ maxWidth: '350px' }}>
              <label className="form-label">Nama Profile Isolir (Mikrotik)</label>
              <input 
                type="text" 
                placeholder="ISOLIR" 
                value={settings.mikrotikIsolirProfile} 
                onChange={(e) => setSettings(prev => ({ ...prev, mikrotikIsolirProfile: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
            </div>

            {saveResult && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                background: saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
                border: `1px solid ${saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
                color: saveResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)', 
                fontSize: '0.85rem', fontWeight: '500',
                maxWidth: '480px'
              }}>
                {saveResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {saveResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Kredensial Mikrotik
              </button>
            </div>

            <div style={{ 
              display: 'flex', alignItems: 'flex-start', gap: '0.75rem', 
              padding: '1rem', borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--accent-cyan) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-cyan) 15%, transparent)',
              fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
              marginTop: '0.5rem'
            }}>
              <Info size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0, marginTop: '2px' }} />
              <span>
                <strong>Prasyarat Mikrotik REST API:</strong> Pastikan Anda menggunakan RouterOS v7.x+ dan mengaktifkan service **www** (atau **www-ssl**) di menu `/ip service` Mikrotik Anda. REST API memudahkan komunikasi tanpa membutuhkan library biner tambahan.
              </span>
            </div>
          </form>
        </section>
      )}

      {/* Tab Content: Midtrans Payment */}
      {activeTab === 'midtrans' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <CreditCard size={20} style={{ color: 'var(--accent-teal)' }} /> Integrasi Midtrans (Payment Gateway)
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Konfigurasikan akun Midtrans Anda agar pelanggan dapat membayar tagihan internet mereka secara mandiri menggunakan **QRIS, GoPay, OVO, ShopeePay, Virtual Account Bank**, dll. Pembayaran sukses akan langsung disinkronkan ke server untuk aktivasi internet instan.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
              <div className="form-group">
                <label className="form-label">Midtrans Server Key</label>
                <input 
                  type="text" 
                  placeholder="SB-Mid-server-..." 
                  value={settings.midtransServerKey} 
                  onChange={(e) => setSettings(prev => ({ ...prev, midtransServerKey: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Midtrans Client Key</label>
                <input 
                  type="text" 
                  placeholder="SB-Mid-client-..." 
                  value={settings.midtransClientKey} 
                  onChange={(e) => setSettings(prev => ({ ...prev, midtransClientKey: e.target.value }))}
                  className="form-input"
                  style={{ width: '100%' }}
                />
              </div>
            </div>

            <div className="form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0' }}>
              <input 
                type="checkbox" 
                id="midtransIsProduction"
                checked={settings.midtransIsProduction} 
                onChange={(e) => setSettings(prev => ({ ...prev, midtransIsProduction: e.target.checked }))}
                style={{ width: '18px', height: '18px', cursor: 'pointer' }}
              />
              <label htmlFor="midtransIsProduction" style={{ fontSize: '0.9rem', cursor: 'pointer', fontWeight: '600' }}>
                Mode Produksi (Production)? *Nonaktifkan untuk Mode Sandbox (Uji Coba)*
              </label>
            </div>

            {saveResult && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                background: saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
                border: `1px solid ${saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
                color: saveResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)', 
                fontSize: '0.85rem', fontWeight: '500',
                maxWidth: '480px'
              }}>
                {saveResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {saveResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Konfigurasi Midtrans
              </button>
            </div>

            <div style={{ 
              display: 'flex', flexDirection: 'column', gap: '0.5rem', 
              padding: '1rem', borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--accent-teal) 5%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-teal) 15%, transparent)',
              fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6,
              marginTop: '0.5rem'
            }}>
              <span style={{ fontWeight: '700', color: 'var(--accent-teal)' }}>Alamat Webhook Midtrans:</span>
              <span style={{ display: 'block', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-heading)', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.2rem' }}>
                https://billing.access.daragroup.cloud/api/public/midtrans-webhook
              </span>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                *Salin alamat ini dan tempel ke kolom **Payment Notification URL** di Dashboard Midtrans Anda (Settings &gt; Configuration).
              </span>
            </div>
          </form>
        </section>
      )}

      {/* Tab Content: Otomatisasi Cron */}
      {activeTab === 'cron' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Globe size={20} style={{ color: 'var(--accent-cyan)' }} /> Penjadwal Tugas Otomatis (Cron Job)
            </h2>
          </div>

          <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Gunakan URL Cron di bawah ini untuk memicu penerbitan tagihan bulanan otomatis, penyelarasan status isolir router, serta pengiriman pesan pengingat WA/Telegram harian. Pengaturan Cron diatur pada sistem VPS atau hosting eksternal.
            </p>

            <div className="form-group" style={{ maxWidth: '550px' }}>
              <label className="form-label">Token Pengaman Cron (Token Authorization)</label>
              <div style={{ display: 'flex', gap: '0.75rem' }}>
                <input 
                  type="text" 
                  placeholder="Token Keamanan Cron" 
                  value={settings.cronToken} 
                  onChange={(e) => setSettings(prev => ({ ...prev, cronToken: e.target.value }))}
                  className="form-input"
                  style={{ flex: 1 }}
                />
                <button type="button" onClick={generateCronToken} className="btn btn-secondary">
                  Acak Token
                </button>
              </div>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Token pengaman untuk mencegah orang luar memicu penjadwalan sistem secara paksa.
              </span>
            </div>

            {settings.cronToken && (
              <div style={{ 
                display: 'flex', flexDirection: 'column', gap: '0.5rem', 
                padding: '1rem', borderRadius: 'var(--radius-sm)',
                background: 'var(--hover-overlay)', border: '1px solid var(--border-color)',
                fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6
              }}>
                <span style={{ fontWeight: '700', color: 'var(--accent-cyan)' }}>Alamat Pemicu Cron Anda:</span>
                <span style={{ display: 'block', wordBreak: 'break-all', fontFamily: 'monospace', color: 'var(--text-heading)', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '8px', marginTop: '0.2rem' }}>
                  https://billing.access.daragroup.cloud/api/cron/sync?token={settings.cronToken}
                </span>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  *Konfigurasikan perintah curl berikut di Server Crontab VPS Anda (menjalankan sync setiap pukul 01.00 pagi):
                </span>
                <span style={{ display: 'block', fontFamily: 'monospace', color: 'var(--accent-teal)', background: 'var(--input-bg)', padding: '0.5rem', borderRadius: '8px', fontSize: '0.8rem' }}>
                  0 1 * * * curl -s "https://billing.access.daragroup.cloud/api/cron/sync?token={settings.cronToken}" &gt; /dev/null 2&gt;&amp;1
                </span>
              </div>
            )}

            {saveResult && (
              <div style={{ 
                display: 'flex', alignItems: 'center', gap: '0.5rem', 
                padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
                background: saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 10%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 10%, transparent)', 
                border: `1px solid ${saveResult.success ? 'color-mix(in srgb, var(--accent-teal) 20%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 20%, transparent)'}`,
                color: saveResult.success ? 'var(--accent-teal)' : 'var(--accent-rose)', 
                fontSize: '0.85rem', fontWeight: '500',
                maxWidth: '480px'
              }}>
                {saveResult.success ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
                {saveResult.message}
              </div>
            )}

            <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
              <button type="submit" className="btn btn-primary" disabled={saveLoading}>
                {saveLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Kredensial Cron
              </button>
            </div>
          </form>
        </section>
      )}

      {/* Tab Content: Log Aktivitas */}
      {activeTab === 'logs' && (
        <section className="panel-card">
          <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem', flexWrap: 'wrap', gap: '1rem' }}>
            <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Activity size={20} style={{ color: 'var(--accent-cyan)' }} /> Log Aktivitas & Sinkronisasi Sistem
            </h2>
            {logs.length > 0 && (
              <button onClick={handleClearLogs} disabled={clearingLogs} className="btn btn-secondary" style={{ color: 'var(--accent-rose)', borderColor: 'color-mix(in srgb, var(--accent-rose) 20%, transparent)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Trash2 size={16} /> Bersihkan Log
              </button>
            )}
          </div>

          <div style={{ padding: '0.5rem 0' }}>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '1.25rem' }}>
              Berikut adalah riwayat aktivitas otomatisasi penagihan bulanan, pembayaran online, sinkronisasi status ke Mikrotik, dan pemicu cron. Maksimal menampilkan 50 log terbaru.
            </p>

            {loadingLogs ? (
              <div style={{ display: 'flex', justifyContent: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>
                <RefreshCw size={24} className="animate-spin" />
                <span style={{ marginLeft: '0.5rem' }}>Memuat log aktivitas...</span>
              </div>
            ) : logs.length === 0 ? (
              <p style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-secondary)' }}>Belum ada log aktivitas yang tercatat.</p>
            ) : (
              <div className="table-container" style={{ maxHeight: '400px', overflowY: 'auto' }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th style={{ width: '180px' }}>Tanggal & Waktu</th>
                      <th style={{ width: '150px' }}>Aksi / Modul</th>
                      <th>Detail Aktivitas</th>
                    </tr>
                  </thead>
                  <tbody>
                    {logs.map((log) => (
                      <tr key={log.id}>
                        <td style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          {new Date(log.createdAt).toLocaleString('id-ID', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                            second: '2-digit'
                          })}
                        </td>
                        <td>
                          <span className={`badge ${getLogBadgeColor(log.action)}`} style={{ fontSize: '0.75rem', padding: '0.15rem 0.6rem' }}>
                            {log.action}
                          </span>
                        </td>
                        <td style={{ fontSize: '0.9rem', color: 'var(--text-heading)', lineHeight: 1.4 }}>
                          {log.message}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Tab Content: Sistem & Keamanan */}
      {activeTab === 'sistem' && (
        <>
          <section className="panel-card">
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Monitor size={20} style={{ color: 'var(--accent-cyan)' }} /> Informasi Aplikasi
              </h2>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.25rem' }}>
              <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Nama Aplikasi</span>
                <strong style={{ fontSize: '1rem' }}>DaraNet ISP Billing Management</strong>
              </div>
              <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Versi</span>
                <strong style={{ fontSize: '1rem' }}>v1.1.0 (Mikrotik & Midtrans Integrated)</strong>
              </div>
              <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Framework</span>
                <strong style={{ fontSize: '1rem' }}>Next.js + Prisma ORM</strong>
              </div>
              <div className="list-item" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '0.25rem' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '1px' }}>Database</span>
                <strong style={{ fontSize: '1rem' }}>PostgreSQL 16</strong>
              </div>
            </div>
          </section>

          <section className="panel-card">
            <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
              <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Server size={20} style={{ color: 'var(--accent-teal)' }} /> Keamanan Sistem
              </h2>
            </div>

            <div className="list-group">
              <div className="list-item">
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Metode Autentikasi</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Cookie-based session dengan HttpOnly flag</span>
                </div>
                <span className="badge badge-active">Aktif</span>
              </div>

              <div className="list-item">
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Bypass Public Routes</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Halaman portal tagihan pelanggan (/invoice/[id]) dapat diakses tanpa login admin</span>
                </div>
                <span className="badge badge-active">Diizinkan</span>
              </div>

              <div className="list-item">
                <div>
                  <strong style={{ display: 'block', fontSize: '0.95rem' }}>Enkripsi Sesi</strong>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Sandi admin dienkripsi menggunakan hash Bcrypt di database</span>
                </div>
                <span className="badge badge-active">Secured</span>
              </div>
            </div>
          </section>
        </>
      )}
    </>
  );
}
