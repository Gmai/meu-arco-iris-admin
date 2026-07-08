"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const pathname = usePathname();

  if (status === "loading") {
    return <div style={styles.loading}>Carregando...</div>;
  }

  return (
    <div style={styles.layout}>
      <header className="glass-panel" style={styles.header}>
        <div className="container" style={styles.navContainer}>
          <div style={styles.brand}>
            <Link href="/dashboard" style={styles.brandLink}>Meu Arco-Iris Admin</Link>
          </div>
          
          <nav style={styles.nav}>
            <Link 
              href="/dashboard" 
              style={pathname === "/dashboard" ? styles.navLinkActive : styles.navLink}
            >
              Painel
            </Link>
            <Link 
              href="/upload" 
              style={pathname === "/upload" ? styles.navLinkActive : styles.navLink}
            >
              Novo Pedido
            </Link>
          </nav>

          <div style={styles.userSection}>
            <span style={styles.userName}>{session?.user?.name}</span>
            <button onClick={() => signOut({ callbackUrl: '/login' })} style={styles.logoutButton}>
              Sair
            </button>
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
    borderBottom: 'none',
  },
  navContainer: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: '4rem',
  },
  brand: {
    fontWeight: '700',
    fontSize: '1.25rem',
    color: 'var(--foreground)',
  },
  brandLink: {
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
