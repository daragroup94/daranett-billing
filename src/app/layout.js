import './globals.css';
import Sidebar from '@/components/Sidebar';

export const metadata = {
  title: 'DaraNet ISP - Customer & Billing Management',
  description: 'Aplikasi Manajemen Pelanggan & Billing RTRW Net DaraNet',
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <body>
        <div className="app-container">
          <Sidebar />
          <main className="main-content">
            {children}
            <footer className="sidebar-footer" style={{ marginTop: 'auto', borderTop: '1px solid var(--border-color)', paddingTop: '1.5rem', fontSize: '0.8rem' }}>
              &copy; {new Date().getFullYear()} <strong>DaraNet</strong>. Build with modern tech for ultimate performance.
            </footer>
          </main>
        </div>
      </body>
    </html>
  );
}
