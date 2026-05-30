'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, Wifi, Receipt, Database, Activity, LogOut } from 'lucide-react';

export default function Sidebar() {
  const pathname = usePathname();

  const links = [
    { href: '/', label: 'Dashboard', icon: LayoutDashboard },
    { href: '/customers', label: 'Pelanggan', icon: Users },
    { href: '/packages', label: 'Paket Internet', icon: Wifi },
    { href: '/billing', label: 'Billing & Tagihan', icon: Receipt },
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

  return (
    <aside className="sidebar">
      <Link href="/" className="logo-container">
        <div className="logo-icon">D</div>
        <div>
          <span className="logo-text">DARANETT</span>
          <span className="logo-sub">RTRW Net Manager</span>
        </div>
      </Link>

      <ul className="nav-links">
        {links.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href));
          return (
            <li key={link.href}>
              <Link href={link.href} className={`nav-link ${isActive ? 'active' : ''}`}>
                <Icon />
                <span>{link.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>

      <div style={{ marginTop: '2rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ 
          background: 'rgba(14, 165, 233, 0.05)', 
          border: '1px solid rgba(14, 165, 233, 0.1)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-cyan)', fontWeight: '600', marginBottom: '0.25rem' }}>
            <Activity size={16} />
            <span>Traefik Online</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>Routed via Cloudflare SSL</p>
        </div>

        <div style={{ 
          background: 'rgba(16, 185, 129, 0.05)', 
          border: '1px solid rgba(16, 185, 129, 0.1)', 
          padding: '1rem', 
          borderRadius: 'var(--radius-sm)',
          fontSize: '0.85rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--accent-teal)', fontWeight: '600', marginBottom: '0.25rem' }}>
            <Database size={16} />
            <span>Database Active</span>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem' }}>PostgreSQL Server Connected</p>
        </div>
      </div>

      <div className="sidebar-footer" style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
        <button 
          onClick={handleLogout}
          className="btn btn-secondary" 
          style={{ 
            width: '100%', 
            padding: '0.5rem 1rem', 
            justifyContent: 'center', 
            fontSize: '0.85rem', 
            gap: '0.5rem',
            borderColor: 'rgba(244, 63, 94, 0.2)',
            color: '#f43f5e'
          }}
          onMouseEnter={(e) => e.target.style.backgroundColor = 'rgba(244, 63, 94, 0.05)'}
          onMouseLeave={(e) => e.target.style.backgroundColor = 'transparent'}
        >
          <LogOut size={16} />
          Keluar (Logout)
        </button>
        <div>
          <p>System Status: v1.0.0</p>
          <p style={{ color: 'var(--accent-cyan)', fontWeight: '500', marginTop: '0.25rem' }}>Active Users: ~350</p>
        </div>
      </div>
    </aside>
  );
}

