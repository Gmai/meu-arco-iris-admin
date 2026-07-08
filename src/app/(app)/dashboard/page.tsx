
import prisma from "@/lib/prisma";
import Link from "next/link";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import { DashboardFilters } from "@/components/DashboardFilters";
import { Pagination } from "@/components/Pagination";
import { SortableServerHeader } from "@/components/SortableServerHeader";

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ search?: string, status?: string, page?: string, limit?: string, sortField?: string, sortOrder?: string }> }) {
  const session = await getServerSession(authOptions);
  const isAdmin = (session?.user as any)?.role === 'ADMIN';

  const params = await searchParams;
  const search = params?.search || "";
  const status = params?.status || "";
  
  const page = parseInt(params?.page || "1", 10);
  const limit = parseInt(params?.limit || "20", 10);
  const skip = (page - 1) * limit;
  
  const sortField = params?.sortField || "createdAt";
  const sortOrder = params?.sortOrder === "asc" ? "asc" : "desc";

  const whereClause: any = {};

  if (search) {
    whereClause.OR = [
      { orderNumber: { contains: search, mode: 'insensitive' } },
      { customerName: { contains: search, mode: 'insensitive' } }
    ];
  }

  if (status) {
    whereClause.status = status;
  }

  const [totalItems, orders] = await prisma.$transaction([
    prisma.order.count({ where: whereClause }),
    prisma.order.findMany({
      where: whereClause,
      orderBy: { [sortField]: sortOrder },
      skip,
      take: limit,
    })
  ]);

  const totalPages = Math.ceil(totalItems / limit);

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

      <DashboardFilters initialSearch={search} initialStatus={status} />

      <section className="glass-panel" style={styles.card}>
        {orders.length === 0 ? (
          <div style={styles.emptyState}>
            Nenhum pedido validado ainda. Vá para a aba "Novo Pedido" para começar!
          </div>
        ) : (
          <table className="responsive-table" style={styles.table}>
            <thead>
              <tr>
                <SortableServerHeader label="Número" field="orderNumber" />
                <SortableServerHeader label="Cliente" field="customerName" />
                <SortableServerHeader label="Data de Registro" field="createdAt" />
                <SortableServerHeader label="Data do Pedido" field="date" />
                <SortableServerHeader label="Status" field="status" />
                <th style={styles.th}>Ações</th>
              </tr>
            </thead>
            <tbody>
              {orders.map(order => (
                <tr key={order.id} style={styles.tr}>
                  <td data-label="Número" style={styles.td}>{order.orderNumber || 'N/A'}</td>
                  <td data-label="Cliente" style={styles.td}>{order.customerName || 'N/A'}</td>
                  <td data-label="Data de Registro" style={styles.td}>{new Date(order.createdAt).toLocaleDateString('pt-BR')}</td>
                  <td data-label="Data do Pedido" style={styles.td}>{order.date ? order.date.toLocaleDateString('pt-BR') : 'N/A'}</td>
                  <td data-label="Status" style={styles.td}>
                    <span style={{
                      ...styles.badge, 
                      backgroundColor: order.status === 'VALID' ? 'rgba(34, 197, 94, 0.1)' : order.status === 'DIVERGENT' ? 'rgba(239, 68, 68, 0.1)' : 'var(--slate-100)',
                      color: order.status === 'VALID' ? 'var(--success)' : order.status === 'DIVERGENT' ? 'var(--danger)' : 'var(--slate-700)'
                    }}>
                      {order.status === 'VALID' ? 'VÁLIDO' : order.status === 'DIVERGENT' ? 'DIVERGENTE' : order.status}
                    </span>
                  </td>
                  <td data-label="Ações" style={styles.td}>
                    <Link href={`/dashboard/${order.id}`} style={styles.actionBtn}>Detalhes</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>

      {totalPages > 1 && (
        <Pagination currentPage={page} totalPages={totalPages} limit={limit} />
      )}
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
