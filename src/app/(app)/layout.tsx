"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  if (status === "loading") {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.layout}>
      <header className="glass-panel" style={styles.header}>
        <div className="container" style={styles.navContainer}>
          <div style={styles.brandGroup}>
            <Link href="/dashboard" style={styles.brandLink}>Meu Arco-Iris Admin</Link>
            <button className="mobile-menu-btn" onClick={() => setIsMenuOpen(!isMenuOpen)} aria-label="Menu">
              {isMenuOpen ? "✕" : "☰"}
            </button>
          </div>
          
          <div className={`desktop-menu ${isMenuOpen ? 'open' : ''}`}>
            <nav className="desktop-nav" style={styles.nav}>
              <Link 
                href="/dashboard" 
                style={pathname === "/dashboard" ? styles.navLinkActive : styles.navLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Painel
              </Link>
              <Link 
                href="/upload" 
                style={pathname === "/upload" ? styles.navLinkActive : styles.navLink}
                onClick={() => setIsMenuOpen(false)}
              >
                Novo Pedido
              </Link>
            </nav>

            <div className="mobile-user-section" style={styles.userSection}>
              <span style={styles.userName}>{session?.user?.name}</span>
              <button onClick={() => signOut({ callbackUrl: '/login' })} style={styles.logoutButton}>
                Sair
              </button>
            </div>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {children}
      </main>
    </div>
  );
}

const styles = {
  loading: {
    display: 'flex',
    height: '100vh',
    alignItems: 'center',
    justifyContent: 'center',
    color: 'var(--foreground)'
  },
  layout: {
    display: 'flex',
    flexDirection: 'column' as const,
    minHeight: '100vh',
  },
  header: {
    position: 'sticky' as const,
    top: 0,
    zIndex: 10,
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'rgba(9, 9, 11, 0.9)',
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap' as const,
    minHeight: '4rem',
    padding: '1rem var(--spacing-md)' // Increased padding
  },
  brandGroup: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    flex: '1 1 auto',
  },
  brandLink: {
    fontWeight: '700',
    fontSize: '1.1rem', // Diminuído
    color: 'inherit',
    textDecoration: 'none',
  },
  nav: {
    display: 'flex',
    gap: '1.5rem',
  },
  navLink: {
    color: '#64748b',
    textDecoration: 'none',
    fontWeight: '500',
    transition: 'color 0.2s',
  },
  navLinkActive: {
    color: 'var(--foreground)',
    textDecoration: 'none',
    fontWeight: '600',
  },
  userSection: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
  },
  userName: {
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  logoutButton: {
    background: 'none',
    border: 'none',
    color: 'var(--danger)',
    cursor: 'pointer',
    fontSize: '0.875rem',
    fontWeight: '500',
  },
  main: {
    flex: 1,
    padding: '2rem 0',
  }
};
