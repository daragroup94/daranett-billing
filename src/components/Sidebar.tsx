'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './sidebar.css';
import {
  LayoutDashboard, Users, Wifi, Receipt, Database,
  Activity, LogOut, Bell, Settings, Sun, Moon, Menu, X,
  ChevronLeft, ChevronRight, Search, User
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
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
          onClick={toggleTheme}
          aria-label="Ubah tema"
        >
          {theme === 'dark' ? <Moon size={20} /> : <Sun size={20} />}
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
                onClick={toggleTheme}
                title={theme === 'dark' ? 'Mode Terang' : 'Mode Gelap'}
                aria-label="Toggle tema"
              >
                {theme === 'dark' ? <Moon size={14} /> : <Sun size={14} />}
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
    </>
  );
}
