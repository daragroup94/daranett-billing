'use client';

import { useState } from 'react';
import { Shield, RefreshCw, AlertTriangle } from 'lucide-react';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    if (!username || !password) {
      setError('Mohon isi username dan password');
      setLoading(false);
      return;
    }

    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || 'Terjadi kesalahan sistem');
      }

      // Successful login - redirect to dashboard with full page reload to refresh middleware session
      window.location.href = '/';
    } catch (err) {
      setError(err.message);
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      width: '100vw',
      position: 'fixed',
      top: 0,
      left: 0,
      zIndex: 9999,
      backgroundColor: '#0b0f19',
      backgroundImage: `
        radial-gradient(at 0% 0%, rgba(139, 92, 246, 0.08) 0px, transparent 50%),
        radial-gradient(at 100% 100%, rgba(14, 165, 233, 0.08) 0px, transparent 50%)
      `,
      fontFamily: "var(--font-sans, 'Outfit', sans-serif)"
    }}>
      <div style={{
        width: '100%',
        maxWidth: '420px',
        background: 'rgba(22, 30, 47, 0.65)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '24px',
        padding: '2.5rem',
        boxShadow: '0 20px 50px rgba(0, 0, 0, 0.4)',
        display: 'flex',
        flexDirection: 'column',
        gap: '2rem'
      }}>
        {/* Brand Header */}
        <div style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{
            background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
            color: '#fff',
            width: '56px',
            height: '56px',
            borderRadius: '16px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '800',
            fontSize: '1.8rem',
            boxShadow: '0 0 25px rgba(14, 165, 233, 0.4)',
            marginBottom: '0.5rem'
          }}>
            D
          </div>
          <h1 style={{
            fontSize: '1.8rem',
            fontWeight: '800',
            background: 'linear-gradient(to right, #fff, #94a3b8)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            letterSpacing: '1px',
            margin: 0
          }}>
            DARANETT
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: '600' }}>
            Customer Billing Panel
          </p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          {error && (
            <div style={{
              background: 'rgba(244, 63, 94, 0.1)',
              border: '1px solid #f43f5e',
              padding: '0.85rem 1rem',
              borderRadius: '12px',
              color: '#f43f5e',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              fontSize: '0.9rem'
            }}>
              <AlertTriangle size={18} style={{ flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Username Admin</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Masukkan username"
              required
              disabled={loading}
              style={{
                background: 'rgba(11, 15, 25, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                width: '100%'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0ea5e9';
                e.target.style.boxShadow = '0 0 10px rgba(14, 165, 233, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            <label style={{ fontSize: '0.85rem', color: '#94a3b8', fontWeight: '500' }}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Masukkan password"
              required
              disabled={loading}
              style={{
                background: 'rgba(11, 15, 25, 0.5)',
                border: '1px solid rgba(255, 255, 255, 0.08)',
                borderRadius: '12px',
                padding: '0.85rem 1rem',
                color: '#fff',
                fontSize: '0.95rem',
                outline: 'none',
                transition: 'all 0.3s ease',
                width: '100%'
              }}
              onFocus={(e) => {
                e.target.style.borderColor = '#0ea5e9';
                e.target.style.boxShadow = '0 0 10px rgba(14, 165, 233, 0.15)';
              }}
              onBlur={(e) => {
                e.target.style.borderColor = 'rgba(255, 255, 255, 0.08)';
                e.target.style.boxShadow = 'none';
              }}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            style={{
              background: 'linear-gradient(135deg, #0ea5e9, #8b5cf6)',
              color: '#fff',
              border: 'none',
              borderRadius: '12px',
              padding: '0.9rem 1.5rem',
              fontSize: '1rem',
              fontWeight: '600',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.75rem',
              boxShadow: '0 4px 15px rgba(14, 165, 233, 0.25)',
              transition: 'all 0.3s ease',
              marginTop: '0.75rem',
              width: '100%'
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = '0 6px 20px rgba(14, 165, 233, 0.4)';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.boxShadow = '0 4px 15px rgba(14, 165, 233, 0.25)';
            }}
          >
            {loading ? (
              <>
                <RefreshCw size={18} className="animate-spin" />
                Masuk ke Panel...
              </>
            ) : (
              <>
                <Shield size={18} />
                Sign In
              </>
            )}
          </button>
        </form>

        <div style={{ textAlign: 'center', fontSize: '0.75rem', color: '#64748b', borderTop: '1px solid rgba(255, 255, 255, 0.06)', paddingTop: '1.25rem' }}>
          Gunakan default credentials <code style={{ color: '#0ea5e9', fontWeight: 'bold' }}>admin / admin</code>
        </div>
      </div>
    </div>
  );
}
