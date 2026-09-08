'use client';

import { useState, useEffect } from 'react';
import { 
  Bell, 
  Send, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  MessageCircle,
  Zap,
  Info
} from 'lucide-react';

export default function NotifikasiPage() {
  const [telegramSettings, setTelegramSettings] = useState({
    telegramBotToken: '',
    telegramChatId: '',
    fonnteBotToken: '',
    fonnteTargetPhone: ''
  });
  const [saveSettingsLoading, setSaveSettingsLoading] = useState(false);
  const [sendTelegramLoading, setSendTelegramLoading] = useState(false);
  const [loadingSettings, setLoadingSettings] = useState(true);
  const [testResult, setTestResult] = useState(null);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const fetchTelegramSettings = async () => {
    setLoadingSettings(true);
    try {
      const res = await fetch('/api/settings');
      if (res.ok) {
        const data = await res.json();
        setTelegramSettings({
          telegramBotToken: data.telegramBotToken || '',
          telegramChatId: data.telegramChatId || '',
          fonnteBotToken: data.fonnteBotToken || '',
          fonnteTargetPhone: data.fonnteTargetPhone || ''
        });
      }
    } catch (err) {
      console.error('Failed to load settings:', err);
    } finally {
      setLoadingSettings(false);
    }
  };

  const handleSaveSettings = async (e) => {
    e.preventDefault();
    setSaveSettingsLoading(true);
    setSaveSuccess(false);
    try {
      const res = await fetch('/api/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(telegramSettings)
      });
      if (!res.ok) throw new Error('Gagal menyimpan pengaturan');
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      alert(err.message);
    } finally {
      setSaveSettingsLoading(false);
    }
  };

  const handleSendTelegram = async () => {
    setSendTelegramLoading(true);
    setTestResult(null);
    try {
      const res = await fetch('/api/telegram/send', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim telegram');
      setTestResult({ success: true, message: data.message || 'Laporan tunggakan berhasil dikirim ke Telegram!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSendTelegramLoading(false);
    }
  };

  const handleSendWhatsApp = async () => {
    setSendTelegramLoading(true); // Reusing the same loading state for simplicity or I could add a new one, but let's reuse to prevent double clicks
    setTestResult(null);
    try {
      const res = await fetch('/api/whatsapp/send', {
        method: 'POST'
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Gagal mengirim WhatsApp');
      setTestResult({ success: true, message: data.message || 'Pesan berhasil dikirim via WhatsApp!' });
    } catch (err) {
      setTestResult({ success: false, message: err.message });
    } finally {
      setSendTelegramLoading(false);
    }
  };

  useEffect(() => {
    fetchTelegramSettings();
  }, []);

  if (loadingSettings) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', gap: '1rem' }}>
        <RefreshCw className="animate-spin" size={48} style={{ color: 'var(--accent-cyan)' }} />
        <p style={{ color: 'var(--text-secondary)' }}>Memuat pengaturan notifikasi...</p>
      </div>
    );
  }

  const isConfigured = telegramSettings.telegramBotToken && telegramSettings.telegramChatId;

  return (
    <>
      <header className="top-header">
        <div className="header-title-container">
          <h1>Notifikasi</h1>
          <p>Kelola pengaturan notifikasi dan integrasi pelaporan otomatis.</p>
        </div>
        <div className="header-actions">
          <button onClick={fetchTelegramSettings} className="btn btn-secondary" title="Refresh data">
            <RefreshCw size={18} /> Refresh
          </button>
        </div>
      </header>

      {/* Status Cards */}
      <section className="dashboard-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))' }}>
        <div className="stat-card cyan">
          <div className="stat-header">
            <span>Telegram Bot</span>
            <div className="stat-icon"><MessageCircle size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            {isConfigured ? 'Terkonfigurasi' : 'Belum Diatur'}
          </div>
          <div className="stat-desc">
            {isConfigured 
              ? <span style={{ color: 'var(--accent-teal)' }}>✓ Bot Token & Chat ID sudah diisi</span>
              : <span style={{ color: 'var(--accent-rose)' }}>✗ Lengkapi konfigurasi di bawah</span>
            }
          </div>
        </div>

        <div className="stat-card purple">
          <div className="stat-header">
            <span>Notifikasi Aktif</span>
            <div className="stat-icon"><Bell size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>
            {isConfigured ? '1 Channel' : '0 Channel'}
          </div>
          <div className="stat-desc">Telegram — Laporan Tunggakan</div>
        </div>

        <div className="stat-card teal">
          <div className="stat-header">
            <span>Kirim Manual</span>
            <div className="stat-icon"><Send size={20} /></div>
          </div>
          <div className="stat-value" style={{ fontSize: '1.5rem' }}>Tersedia</div>
          <div className="stat-desc">Kirim laporan tunggakan secara instan</div>
        </div>
      </section>

      {/* Telegram Configuration */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-cyan)' }}>⚙️</span> Integrasi Telegram Bot (Laporan Tunggakan)
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Masukkan Kredensial Telegram Bot Anda agar sistem dapat mengirimkan daftar pelanggan yang menunggak secara otomatis (harian) atau manual ke chat grup/pribadi Telegram Anda.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Telegram Bot Token</label>
              <input 
                type="text" 
                placeholder="123456789:ABCdefGhIJKlmNoPQRsTUVwxyZ" 
                value={telegramSettings.telegramBotToken} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, telegramBotToken: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Token Bot Telegram yang diperoleh dari <strong>@BotFather</strong>.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Telegram Chat ID / Group ID</label>
              <input 
                type="text" 
                placeholder="-1001234567890 atau 12345678" 
                value={telegramSettings.telegramChatId} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, telegramChatId: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Chat ID tujuan laporan (bisa ID grup atau ID pribadi. Dapatkan via <strong>@userinfobot</strong>).
              </span>
            </div>
          </div>

          {saveSuccess && (
            <div style={{ 
              display: 'flex', alignItems: 'center', gap: '0.5rem', 
              padding: '0.75rem 1rem', borderRadius: 'var(--radius-sm)',
              background: 'color-mix(in srgb, var(--accent-teal) 10%, transparent)', border: '1px solid color-mix(in srgb, var(--accent-teal) 20%, transparent)',
              color: 'var(--accent-teal)', fontSize: '0.85rem', fontWeight: '500'
            }}>
              <CheckCircle size={16} /> Pengaturan Telegram berhasil disimpan!
            </div>
          )}

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={handleSendTelegram}
              disabled={sendTelegramLoading || !telegramSettings.telegramBotToken || !telegramSettings.telegramChatId}
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'color-mix(in srgb, var(--accent-cyan) 10%, transparent)', color: 'var(--accent-cyan)', border: '1px solid color-mix(in srgb, var(--accent-cyan) 20%, transparent)' }}
            >
              {sendTelegramLoading ? <RefreshCw className="animate-spin" size={16} /> : '⚡'} Kirim Laporan Telegram
            </button>
            
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={saveSettingsLoading}>
              {saveSettingsLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Kredensial
            </button>
          </div>
        </form>
      </section>

      {/* WhatsApp Configuration */}
      <section className="panel-card">
        <div className="panel-header" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <span style={{ color: 'var(--accent-teal)' }}>💬</span> Integrasi WhatsApp (Fonnte)
          </h2>
        </div>

        <form onSubmit={handleSaveSettings} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '0.5rem 0' }}>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
            Masukkan Kredensial Fonnte Anda untuk mengirimkan notifikasi tunggakan otomatis langsung ke nomor WhatsApp pelanggan.
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}>
            <div className="form-group">
              <label className="form-label">Fonnte API Token</label>
              <input 
                type="text" 
                placeholder="TOKEN_FONNTE_ANDA" 
                value={telegramSettings.fonnteBotToken} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, fonnteBotToken: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Token API yang diperoleh dari akun <strong>Fonnte</strong> Anda.
              </span>
            </div>

            <div className="form-group">
              <label className="form-label">Nomor WhatsApp Admin (Opsional)</label>
              <input 
                type="text" 
                placeholder="081234567890" 
                value={telegramSettings.fonnteTargetPhone} 
                onChange={(e) => setTelegramSettings(prev => ({ ...prev, fonnteTargetPhone: e.target.value }))}
                className="form-input"
                style={{ width: '100%' }}
              />
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'block', marginTop: '0.25rem' }}>
                Nomor admin untuk menerima rekap pengiriman pesan.
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '1rem', justifyContent: 'flex-end', marginTop: '0.5rem' }}>
            <button 
              type="button" 
              onClick={handleSendWhatsApp}
              disabled={sendTelegramLoading || !telegramSettings.fonnteBotToken}
              className="btn btn-secondary" 
              style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', background: 'color-mix(in srgb, var(--accent-teal) 10%, transparent)', color: 'var(--accent-teal)', border: '1px solid color-mix(in srgb, var(--accent-teal) 20%, transparent)' }}
            >
              {sendTelegramLoading ? <RefreshCw className="animate-spin" size={16} /> : '💬'} Kirim Laporan WhatsApp
            </button>
            <button type="submit" className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }} disabled={saveSettingsLoading}>
              {saveSettingsLoading ? <RefreshCw className="animate-spin" size={16} /> : '💾'} Simpan Kredensial
            </button>
          </div>
        </form>
      </section>

      {/* Test Result */}
      {testResult && (
        <section className="panel-card" style={{ 
          borderColor: testResult.success ? 'color-mix(in srgb, var(--accent-teal) 30%, transparent)' : 'color-mix(in srgb, var(--accent-rose) 30%, transparent)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {testResult.success 
              ? <CheckCircle size={24} style={{ color: 'var(--accent-teal)' }} />
              : <AlertTriangle size={24} style={{ color: 'var(--accent-rose)' }} />
            }
            <div>
              <h3 style={{ fontSize: '1rem', fontWeight: '600', marginBottom: '0.25rem' }}>
                {testResult.success ? 'Berhasil Terkirim!' : 'Gagal Mengirim'}
              </h3>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>{testResult.message}</p>
            </div>
          </div>
        </section>
      )}

      {/* How-to Guide */}
      <section className="panel-card">
        <div className="panel-header">
          <h2 className="panel-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Info size={20} style={{ color: 'var(--accent-cyan)' }} /> Panduan Konfigurasi Telegram Bot
          </h2>
        </div>
        <div className="list-group">
          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>1. Buat Bot Telegram</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Buka @BotFather di Telegram → kirim /newbot → ikuti instruksi → salin Bot Token</span>
            </div>
            <Zap size={18} style={{ color: 'var(--accent-cyan)', flexShrink: 0 }} />
          </div>
          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>2. Dapatkan Chat ID</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Buka @userinfobot di Telegram → kirim /start → salin Chat ID atau Group ID tujuan</span>
            </div>
            <Zap size={18} style={{ color: 'var(--accent-purple)', flexShrink: 0 }} />
          </div>
          <div className="list-item">
            <div>
              <strong style={{ display: 'block', fontSize: '0.95rem' }}>3. Simpan & Tes</strong>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Masukkan Bot Token & Chat ID di form atas → Simpan → klik &ldquo;Kirim Laporan Sekarang&rdquo;</span>
            </div>
            <Zap size={18} style={{ color: 'var(--accent-teal)', flexShrink: 0 }} />
          </div>
        </div>
      </section>
    </>
  );
}
