'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './sidebar.css';
import {
  LayoutDashboard, Users, Wifi, Receipt, Database,
  Activity, LogOut, Bell, Settings, Sun, Moon, Menu, X,
  ChevronLeft, ChevronRight, Search, User, Wallet, Palette, Check
} from 'lucide-react';
import { THEMES } from '@/lib/themes';

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
  const [showThemeModal, setShowThemeModal] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Read theme and sidebar collapse from localStorage on mount
  useEffect(() => {
    const storedTheme = localStorage.getItem('daranett-theme') || 'dark';
    setTheme(storedTheme);
    document.documentElement.setAttribute('data-theme', storedTheme);

    const isCollapsed = localStorage.getItem('daranett-sidebar-collapsed') === 'true';
    setCollapsed(isCollapsed);
    if (isCollapsed) {
      document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
    } else {
      document.documentElement.removeAttribute('data-sidebar-collapsed');
    }
  }, []);

  // Shortcut Ctrl+K / Cmd+K to focus search input
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Select a specific theme
  const selectTheme = useCallback((themeId: string) => {
    setTheme(themeId);
    localStorage.setItem('daranett-theme', themeId);
    document.documentElement.setAttribute('data-theme', themeId);
  }, []);

  // Toggle theme between light and dark
  const toggleTheme = useCallback(() => {
    setTheme((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark';
      localStorage.setItem('daranett-theme', next);
      document.documentElement.setAttribute('data-theme', next);
      return next;
    });
  }, []);

  // Toggle collapse state on desktop
  const toggleCollapse = useCallback(() => {
    setCollapsed((prev) => {
      const next = !prev;
      localStorage.setItem('daranett-sidebar-collapsed', next ? 'true' : 'false');
      if (next) {
        document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
      } else {
        document.documentElement.removeAttribute('data-sidebar-collapsed');
      }
      return next;
    });
  }, []);

  // Close mobile drawer on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Lock body scroll when mobile drawer is open
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const mainLinks = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Pelanggan', icon: Users },
    { href: '/packages', label: 'Paket Internet', icon: Wifi },
    { href: '/billing', label: 'Billing & Tagihan', icon: Receipt },
    { href: '/kas', label: 'Buku Kas & Biaya', icon: Wallet },
  ];

  const otherLinks = [
    { href: '/laporan', label: 'Laporan Keuangan', icon: Activity },
    { href: '/notifikasi', label: 'Notifikasi', icon: Bell },
    { href: '/backup', label: 'Backup Database', icon: Database },
    { href: '/pengaturan', label: 'Pengaturan', icon: Settings },
  ];

  const query = searchQuery.trim().toLowerCase();
  const filteredMain = query
    ? mainLinks.filter((l) => l.label.toLowerCase().includes(query))
    : mainLinks;
  const filteredOther = query
    ? otherLinks.filter((l) => l.label.toLowerCase().includes(query))
    : otherLinks;
  const hasResults = filteredMain.length > 0 || filteredOther.length > 0;

  const handleLogout = async () => {
    if (!confirm('Apakah Anda yakin ingin keluar?')) return;
    try {
      const res = await fetch('/api/auth/logout', { method: 'POST' });
      if (res.ok) {
        window.location.href = '/login';
      }
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const isActive = (href: string) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const renderLink = (
    link: { href: string; label: string; icon: any },
    index: number
  ) => {
    const Icon = link.icon;
    const active = isActive(link.href);
    return (
      <li
        key={link.href}
        style={{ animationDelay: `${index * 0.03}s` }}
        className="nav-item-animated"
      >
        <Link
          id={`sidebar-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          href={link.href}
          className={`nav-link ${active ? 'active' : ''}`}
          data-tooltip={link.label}
        >
          <Icon className="nav-icon" size={17} />
          <span className="nav-label">{link.label}</span>
          {active && <span className="active-glow-bar" />}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Top Navbar */}
      <div className="mobile-top-nav">
        <button
          id="mobile-hamburger"
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Buka menu"
        >
          <Menu size={22} />
        </button>

        <Link href="/" className="mobile-logo">
          <div className="logo-icon logo-icon--small">D</div>
          <span className="logo-text">DARANETT</span>
        </Link>

        <button
          id="mobile-theme-toggle"
          className="mobile-theme-toggle"
          onClick={() => setShowThemeModal(true)}
          aria-label="Pilih tema tampilan"
          title="Pilih tema tampilan"
        >
          <Palette size={20} />
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={`sidebar${mobileOpen ? ' sidebar-open' : ''}${
          collapsed ? ' sidebar-collapsed' : ''
        }`}
      >
        {/* Floating Collapse button on desktop edge */}
        <button
          id="sidebar-collapse-btn"
          className="collapse-btn-floating"
          onClick={toggleCollapse}
          aria-label="Kecilkan/Besarkan sidebar"
          title={collapsed ? 'Perluas Sidebar' : 'Kecilkan Sidebar'}
        >
          {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
        </button>

        {/* FIXED TOP AREA (Header & Compact Search) */}
        <div className="sidebar-top">
          <div className="sidebar-header">
            <Link href="/" className="logo-container">
              <div className="logo-icon">D</div>
              <div className="logo-text-group">
                <span className="logo-text">DARANETT</span>
                <span className="logo-sub">RTRW NET MANAGER</span>
              </div>
            </Link>

            <div className="sidebar-header-actions">
              <button
                id="header-theme-toggle"
                className="header-theme-btn"
                onClick={() => setShowThemeModal(true)}
                title="Pilih Tema Tampilan (8 Tema)"
                aria-label="Pilih Tema Tampilan"
              >
                <Palette size={14} />
              </button>

              <button
                id="sidebar-close-btn"
                className="sidebar-close"
                onClick={() => setMobileOpen(false)}
                aria-label="Tutup menu"
              >
                <X size={18} />
              </button>
            </div>
          </div>

          {/* Interactive Compact Search */}
          <div className="sidebar-search">
            <Search size={14} className="search-icon" />
            <input
              ref={searchInputRef}
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari menu..."
              className="search-input"
            />
            {searchQuery ? (
              <button
                onClick={() => setSearchQuery('')}
                className="search-clear-btn"
                title="Hapus pencarian"
              >
                <X size={13} />
              </button>
            ) : (
              <span className="search-kbd-hint">⌘K</span>
            )}
          </div>
        </div>

        {/* NAVIGATION AREA (All items visible without scroll on typical screens) */}
        <div className="sidebar-nav-scroll">
          {filteredMain.length > 0 && (
            <div className="nav-section">
              <span className="nav-section-title">Menu Utama</span>
              <ul className="nav-links">
                {filteredMain.map((link, i) => renderLink(link, i))}
              </ul>
            </div>
          )}

          {filteredMain.length > 0 && filteredOther.length > 0 && (
            <div className="nav-separator" />
          )}

          {filteredOther.length > 0 && (
            <div className="nav-section">
              <span className="nav-section-title">Lainnya</span>
              <ul className="nav-links">
                {filteredOther.map((link, i) =>
                  renderLink(link, i + filteredMain.length)
                )}
              </ul>
            </div>
          )}

          {!hasResults && (
            <div className="nav-empty-state">
              <span>Tidak ada menu yang sesuai &quot;{searchQuery}&quot;</span>
            </div>
          )}
        </div>

        {/* FIXED BOTTOM AREA (Compact Status & Profile) */}
        <div className="sidebar-bottom">
          <div
            className="sidebar-status-pill"
            title="Sistem Berjalan Normal • Cloud Gateway & Database Terhubung"
          >
            <span className="status-pulse-dot" />
            <span className="status-text">Sistem Normal</span>
            <span className="status-version">v2.1</span>
          </div>

          <div className="sidebar-footer">
            <div
              className={`user-profile-compact ${
                showDropdown ? 'active' : ''
              }`}
              onClick={() => setShowDropdown(!showDropdown)}
              title="Profil & Opsi"
            >
              <div className="user-avatar">
                <User size={15} />
              </div>
              <div className="user-info">
                <span className="user-name">Admin DaraNet</span>
                <span className="user-role">Superuser</span>
              </div>
              <Settings size={13} className="user-settings-icon" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="user-dropdown-menu">
                <Link
                  href="/pengaturan"
                  className="dropdown-item"
                  onClick={() => setShowDropdown(false)}
                >
                  <Settings size={13} /> Pengaturan Akun
                </Link>
                <button
                  onClick={() => {
                    setShowDropdown(false);
                    setShowThemeModal(true);
                  }}
                  className="dropdown-item"
                  type="button"
                >
                  <Palette size={13} />
                  <span>Pilih Tema (8 Tema)</span>
                </button>
                <div className="dropdown-divider" />
                <button
                  onClick={handleLogout}
                  className="dropdown-item logout-text"
                >
                  <LogOut size={13} /> Keluar
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* ── THEME PICKER MODAL (8 THEMES) ── */}
      {showThemeModal && (
        <div 
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0, 0, 0, 0.75)',
            backdropFilter: 'blur(8px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 99999,
            padding: '1rem'
          }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowThemeModal(false);
          }}
        >
          <div 
            style={{
              background: 'var(--bg-secondary-solid, #0f172a)',
              border: '1px solid var(--border-color)',
              borderRadius: '20px',
              maxWidth: '680px',
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.6)',
              padding: '1.5rem',
              color: 'var(--text-primary)'
            }}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid var(--border-color)', paddingBottom: '1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, var(--accent-cyan), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff' }}>
                  <Palette size={18} />
                </div>
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 700, color: 'var(--text-heading)' }}>
                    Pilih Tema Tampilan
                  </h3>
                  <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Tersedia 8 preset visual modern yang dirancang khusus untuk DaraNet
                  </p>
                </div>
              </div>
              <button 
                onClick={() => setShowThemeModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', padding: '4px' }}
                title="Tutup modal"
              >
                <X size={20} />
              </button>
            </div>

            {/* Themes Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '0.85rem' }}>
              {THEMES.map((t) => {
                const isSelected = theme === t.id;
                return (
                  <div
                    key={t.id}
                    onClick={() => selectTheme(t.id)}
                    style={{
                      background: isSelected ? 'var(--hover-overlay-strong)' : 'var(--hover-overlay)',
                      border: isSelected ? `2px solid ${t.accent}` : '1px solid var(--border-color)',
                      borderRadius: '14px',
                      padding: '1rem',
                      cursor: 'pointer',
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '0.65rem',
                      position: 'relative',
                      transition: 'all 0.2s ease',
                      boxShadow: isSelected ? `0 0 16px ${t.accent}33` : 'none'
                    }}
                  >
                    {/* Top Row: Mini Swatch & Type Badge */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      {/* Color dots */}
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.bg, border: '1px solid rgba(255,255,255,0.2)' }} title="Background" />
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.cardBg, border: '1px solid rgba(255,255,255,0.2)' }} title="Card Background" />
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.accent }} title="Accent 1" />
                        <div style={{ width: 18, height: 18, borderRadius: '50%', background: t.accent2 }} title="Accent 2" />
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                        <span style={{ 
                          fontSize: '0.68rem', 
                          fontWeight: 700, 
                          padding: '2px 7px', 
                          borderRadius: '12px', 
                          background: t.type === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                          color: 'var(--text-secondary)' 
                        }}>
                          {t.type === 'dark' ? 'Gelap' : 'Terang'}
                        </span>
                        {isSelected && (
                          <span style={{ 
                            fontSize: '0.68rem', 
                            fontWeight: 700, 
                            padding: '2px 8px', 
                            borderRadius: '12px', 
                            background: t.accent, 
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '3px'
                          }}>
                            <Check size={10} /> Aktif
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Name & Description */}
                    <div>
                      <strong style={{ fontSize: '0.95rem', color: isSelected ? t.accent : 'var(--text-heading)', display: 'block' }}>
                        {t.name}
                      </strong>
                      <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: '0.2rem 0 0 0', lineHeight: 1.4 }}>
                        {t.description}
                      </p>
                    </div>

                    {/* Mini Preview Bar */}
                    <div style={{ 
                      background: t.bg, 
                      borderRadius: '8px', 
                      padding: '6px 10px', 
                      display: 'flex', 
                      alignItems: 'center', 
                      justifyContent: 'space-between',
                      border: `1px solid ${t.border}`
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <div style={{ width: 8, height: 8, borderRadius: '50%', background: t.accent }} />
                        <span style={{ fontSize: '0.7rem', color: t.type === 'dark' ? '#f1f5f9' : '#0f172a', fontWeight: 600 }}>DaraNet</span>
                      </div>
                      <span style={{ fontSize: '0.65rem', color: t.accent, fontWeight: 700 }}>
                        {t.id.toUpperCase()}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '1.25rem', paddingTop: '1rem', borderTop: '1px solid var(--border-color)' }}>
              <button
                onClick={() => setShowThemeModal(false)}
                className="btn btn-primary"
                style={{ minWidth: '100px' }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
