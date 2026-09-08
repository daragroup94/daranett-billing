import './globals.css';
import Sidebar from '@/components/Sidebar';
import { Metadata } from 'next';
import React from 'react';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'DaraNet ISP - Customer & Billing Management',
  description: 'Aplikasi Manajemen Pelanggan & Billing RTRW Net DaraNet',
};

const themeInitScript = `
  (function() {
    try {
      var theme = localStorage.getItem('daranett-theme') || 'dark';
      document.documentElement.setAttribute('data-theme', theme);
      
      var collapsed = localStorage.getItem('daranett-sidebar-collapsed') === 'true';
      if (collapsed) {
        document.documentElement.setAttribute('data-sidebar-collapsed', 'true');
      }
    } catch (e) {
      document.documentElement.setAttribute('data-theme', 'dark');
    }
  })();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="id" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
      </head>
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
            <footer className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} <strong>DaraNet</strong> &mdash; Crafted with passion for seamless connectivity.
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
