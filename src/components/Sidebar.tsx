'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import './sidebar.css';
import {
  LayoutDashboard, Users, Wifi, Receipt, Database,
  Activity, LogOut, Bell, Settings, Sun, Moon, Menu, X,
  ChevronLeft, ChevronRight, Server, Search, User
} from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();
  const [theme, setTheme] = useState('dark');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [hoveredLink, setHoveredLink] = useState({ section: null, top: 0 });

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

  const isActive = (href) =>
    pathname === href || (href !== '/' && pathname.startsWith(href));

  const renderLink = (link, index, sectionName) => {
    const Icon = link.icon;
    const active = isActive(link.href);
    return (
      <li 
        key={link.href}
        onMouseEnter={(e) => setHoveredLink({ section: sectionName, top: e.currentTarget.offsetTop })}
        style={{ animationDelay: `${index * 0.05}s` }}
        className="nav-item-animated"
      >
        <Link 
          id={`sidebar-link-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
          href={link.href} 
          className={`nav-link ${active ? 'active' : ''}`}
          data-tooltip={link.label}
        >
          <Icon className="nav-icon" size={18} />
          <span className="nav-label">{link.label}</span>
          {active && <span className="active-glow-bar" />}
        </Link>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Top Navbar (Sleek Glassmorphic) */}
      <div className="mobile-top-nav">
        <button
          id="mobile-hamburger"
          className="mobile-hamburger"
          onClick={() => setMobileOpen(true)}
          aria-label="Open menu"
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
          aria-label="Toggle theme"
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
      <aside className={`sidebar${mobileOpen ? ' sidebar-open' : ''}${collapsed ? ' sidebar-collapsed' : ''}`}>
        
        {/* Sleek Floating Collapse button on desktop edge */}
        <button
          id="sidebar-collapse-btn"
          className="collapse-btn-floating"
          onClick={toggleCollapse}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        {/* FIXED TOP AREA */}
        <div className="sidebar-top">
          {/* Header row: logo + close (mobile) */}
          <div className="sidebar-header">
            <Link href="/" className="logo-container">
              <div className="logo-icon">D</div>
              <div className="logo-text-group">
                <span className="logo-text">DARANETT</span>
                <span className="logo-sub">RTRW Net Manager</span>
              </div>
            </Link>

            {/* Mobile close button */}
            <button
              id="sidebar-close-btn"
              className="sidebar-close"
              onClick={() => setMobileOpen(false)}
              aria-label="Close menu"
            >
              <X size={20} />
            </button>
          </div>

          {/* Theme Toggle (iOS Switch) */}
          <div className="theme-toggle-container">
            <button id="theme-toggle-switch" className="theme-toggle-switch" onClick={toggleTheme} aria-label="Toggle theme">
              <div className={`theme-toggle-switch-slider ${theme === 'light' ? 'slide-light' : ''}`}>
                {theme === 'dark' ? <Moon size={12} className="switch-icon" /> : <Sun size={12} className="switch-icon" />}
              </div>
              <span className="theme-toggle-switch-text">
                {theme === 'dark' ? 'Mode Gelap' : 'Mode Terang'}
              </span>
            </button>
          </div>
          
          {/* Quick Search */}
          <div className="sidebar-search">
            <Search size={16} className="search-icon" />
            <input type="text" placeholder="Cari... ⌘K" className="search-input" />
          </div>
        </div>

        {/* SCROLLABLE MIDDLE AREA (Menu Utama & Lainnya) */}
        <div className="sidebar-nav-scroll">
          {/* Main section */}
          <div className="nav-section">
            <span className="nav-section-title">Menu Utama</span>
            <ul className="nav-links" onMouseLeave={() => setHoveredLink({ section: null, top: 0 })}>
              {hoveredLink.section === 'main' && <div className="fluid-hover-bg" style={{ top: hoveredLink.top }} />}
              {mainLinks.map((link, i) => renderLink(link, i, 'main'))}
            </ul>
          </div>

          {/* Separator */}
          <div className="nav-separator" />

          {/* Other section */}
          <div className="nav-section">
            <span className="nav-section-title">Lainnya</span>
            <ul className="nav-links" onMouseLeave={() => setHoveredLink({ section: null, top: 0 })}>
              {hoveredLink.section === 'other' && <div className="fluid-hover-bg" style={{ top: hoveredLink.top }} />}
              {otherLinks.map((link, i) => renderLink(link, i + mainLinks.length, 'other'))}
            </ul>
          </div>
        </div>

        {/* FIXED BOTTOM AREA (Status Cards & Logout) */}
        <div className="sidebar-bottom">
          {/* Status Cards (Futuristic Diagnostic Widget) */}
          <div className="diagnostic-widget">
            <div className="diag-header">
              <span className="diag-title">SYSTEM MONITOR</span>
              <span className="diag-pulse" />
            </div>
            <div className="diag-list">
              <div className="diag-item">
                <span className="diag-indicator diag-indicator--active" />
                <Server size={12} />
                <span className="diag-name">Cloud Gateway</span>
              </div>
              <div className="diag-item">
                <span className="diag-indicator diag-indicator--active" />
                <Database size={12} />
                <span className="diag-name">Postgres DB</span>
              </div>
            </div>
          </div>

          <div className="sidebar-footer">
            <div className={`user-profile-premium ${showDropdown ? 'active' : ''}`} onClick={() => setShowDropdown(!showDropdown)}>
              <div className="user-avatar">
                <User size={18} />
              </div>
              <div className="user-info">
                <span className="user-name">Admin DaraNet</span>
                <span className="user-role">Superuser</span>
              </div>
              <Settings size={14} className="user-settings-icon" />
            </div>

            {/* Dropdown Menu */}
            {showDropdown && (
              <div className="user-dropdown-menu">
                <button onClick={() => window.location.href='/pengaturan'} className="dropdown-item">
                  <Settings size={14} className="dropdown-icon" /> Pengaturan Akun
                </button>
                <div className="dropdown-divider" />
                <button onClick={handleLogout} className="dropdown-item logout-text">
                  <LogOut size={14} className="dropdown-icon" /> Keluar
                </button>
              </div>
            )}
            
            <div className="version-info-premium">
              <p>Core Build v2.1.0</p>
            </div>
          </div>
        </div>
      </aside>

      
    </>
  );
}
