
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const orders = await prisma.order.findMany({
    orderBy: { createdAt: 'desc' }
  });

  return (
    <main className="container">
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Histórico de Pedidos</h1>
          <p style={styles.subtitle}>Consulte e filtre os pedidos já validados pelo sistema.</p>
        </div>
        {isAdmin && (
          <Link href="/admin/users" style={styles.adminLink}>
            ⚙️ Gerenciar Usuários
          </Link>
        )}
      </header>

      <section style={styles.filterSection} aria-label="Filtros de busca">
        <input style={styles.filterInput} type="text" placeholder="Buscar por número do pedido..." aria-label="Buscar por número do pedido" />
        <input style={styles.filterInput} type="text" placeholder="Buscar por cliente..." aria-label="Buscar por cliente" />
        <select style={styles.filterSelect} aria-label="Filtrar por status">
          <option value="">Todos os status</option>
          <option value="VALID">Válidos</option>
          <option value="DIVERGENT">Com Divergência</option>
          <option value="PENDING">Pendentes</option>
        </select>
        <button style={styles.filterButton}>Filtrar</button>
      </section>

      <section className="glass-panel" style={styles.card}>
        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            Nenhum pedido validado ainda. Vá para a aba "Novo Pedido" para começar!
          </div>
        ) : (
          <table style={styles.table}>
            <thead>
              <tr>
                <th style={styles.th}>Número</th>
                <th style={styles.th}>Cliente</th>
                <th style={styles.th}>Data</th>
                <th style={styles.th}>Status</th>
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={styles.tr}>
                  <td style={styles.td}>{order.orderNumber || 'N/A'}</td>
                  <td style={styles.td}>{order.customerName || 'N/A'}</td>
                  <td style={styles.td}>{order.date ? order.date.toLocaleDateString('pt-BR') : 'N/A'}</td>
                  <td style={styles.td}>
                    <span style={{
                      ...styles.badge, 
                      backgroundColor: order.status === 'VALID' ? 'rgba(34, 197, 94, 0.1)' : order.status === 'DIVERGENT' ? 'rgba(239, 68, 68, 0.1)' : 'var(--slate-100)',
                      color: order.status === 'VALID' ? 'var(--success)' : order.status === 'DIVERGENT' ? 'var(--danger)' : 'var(--slate-700)'
                    }}>
                      {order.status === 'VALID' ? 'VÁLIDO' : order.status === 'DIVERGENT' ? 'DIVERGENTE' : order.status}
                    </span>
                  </td>
                  <td style={styles.td}>
                    <Link href={`/dashboard/${order.id}`} style={styles.actionBtn}>Detalhes</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

const styles = {
  header: {
    marginBottom: 'var(--spacing-2xl)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start'
  },
  adminLink: {
    backgroundColor: 'var(--slate-100)',
    color: 'var(--slate-700)',
    padding: 'var(--spacing-sm) var(--spacing-md)',
    borderRadius: '8px',
    textDecoration: 'none',
    fontWeight: '600',
    fontSize: '0.875rem',
    border: '1px solid var(--border)',
  },
  title: {
    fontSize: '2rem',
    fontWeight: '700',
    color: 'var(--foreground)',
  },
  subtitle: {
    color: 'var(--text-muted)',
    marginTop: 'var(--spacing-sm)',
  },
  card: {
    borderRadius: '12px',
    overflow: 'hidden',
  },
  filterSection: {
    display: 'flex',
    gap: 'var(--spacing-md)',
    marginBottom: 'var(--spacing-2xl)',
    flexWrap: 'wrap' as const,
  },
  filterInput: {
    padding: 'var(--spacing-md)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    flex: 1,
    minWidth: '200px',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  filterSelect: {
    padding: 'var(--spacing-md)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
    minWidth: '150px',
    outline: 'none',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
  },
  filterButton: {
    backgroundColor: 'var(--primary)',
    color: 'white',
    padding: 'var(--spacing-md) var(--spacing-xl)',
    borderRadius: '8px',
    border: 'none',
    fontWeight: '600',
    cursor: 'pointer',
  },
  emptyState: {
    padding: 'var(--spacing-3xl) var(--spacing-xl)',
    textAlign: 'center' as const,
    color: 'var(--text-muted)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse' as const,
  },
  th: {
    textAlign: 'left' as const,
    padding: 'var(--spacing-md)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
  },
  tr: {
    borderBottom: '1px solid var(--border)',
  },
  td: {
    padding: 'var(--spacing-md)',
    fontSize: '0.875rem',
  },
  badge: {
    padding: '0.25rem 0.75rem',
    borderRadius: '9999px',
    fontSize: '0.75rem',
    fontWeight: '600',
  },
  actionBtn: {
    background: 'none',
    border: 'none',
    color: 'var(--primary-light)',
    cursor: 'pointer',
    fontWeight: '500',
  }
};
