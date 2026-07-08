"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("EMPLOYEE");
  const [isCreating, setIsCreating] = useState(false);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Acesso negado ou erro ao carregar usuários.");
      const data = await res.json();
      setUsers(data);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, userRole: role })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      // Limpar form
      setName(""); setEmail(""); setPassword(""); setRole("EMPLOYEE");
      // Recarregar
      fetchUsers();
    } catch (err: any) {
      alert("Erro: " + err.message);
    } finally {
      setIsCreating(false);
    }
  };

  const togglePermission = async (userId: string, permissionKey: string, currentValue: boolean) => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    const currentPermissions = user.permissions || {};
    const newPermissions = { ...currentPermissions, [permissionKey]: !currentValue };

    // Update UI Optimistically
    setUsers(users.map(u => u.id === userId ? { ...u, permissions: newPermissions } : u));

    try {
      const res = await fetch(`/api/users/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ permissions: newPermissions })
      });
      if (!res.ok) {
        throw new Error("Falha ao salvar permissão.");
      }
    } catch (err: any) {
      alert(err.message);
      // Revert UI
      fetchUsers();
    }
  };

  if (loading) return <div className="container" style={{padding: '2rem'}}>Carregando...</div>;
  if (error) return <div className="container" style={{padding: '2rem', color: 'red'}}>{error}</div>;

  return (
    <main className="container">
      <header style={styles.header}>
        <Link href="/dashboard" style={styles.backLink}>← Voltar para o Painel</Link>
        <h1 style={styles.title}>Gestão de Acessos</h1>
        <p style={styles.subtitle}>Gerencie os usuários e suas permissões exclusivas.</p>
      </header>

      <div style={styles.grid}>
        {/* Formulário Criar Usuário */}
        <section className="glass-panel" style={styles.card} aria-label="Adicionar Usuário">
          <h2 style={styles.sectionTitle}>Adicionar Novo Usuário</h2>
          <form onSubmit={handleCreateUser} style={{ display: 'flex', flexDirection: 'column', gap: 'var(--spacing-md)' }}>
            <div>
              <label style={styles.label}>Nome</label>
              <input style={styles.input} type="text" value={name} onChange={e => setName(e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>E-mail</label>
              <input style={styles.input} type="email" value={email} onChange={e => setEmail(e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Senha (Provisória)</label>
              <input style={styles.input} type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <div>
              <label style={styles.label}>Tipo de Conta</label>
              <select style={styles.input} value={role} onChange={e => setRole(e.target.value)}>
                <option value="EMPLOYEE">Funcionário</option>
                <option value="ADMIN">Administrador</option>
              </select>
            </div>
            <button type="submit" disabled={isCreating} style={styles.submitButton}>
              {isCreating ? "Criando..." : "Criar Usuário"}
            </button>
          </form>
        </section>

        {/* Lista de Usuários */}
        <section className="glass-panel" style={{...styles.card, flex: 2}} aria-label="Lista de Usuários">
          <h2 style={styles.sectionTitle}>Usuários do Sistema</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)', textAlign: 'left' }}>
                <th style={styles.th}>Nome</th>
                <th style={styles.th}>Papel</th>
                <th style={styles.th}>Permissões Extras (Funcionários)</th>
              </tr>
            </thead>
            <tbody>
              {users.map(u => {
                const isAdmin = u.role === 'ADMIN';
                const perms = u.permissions || {};

                return (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--border)' }}>
                    <td style={styles.td}>
                      <div style={{fontWeight: 600}}>{u.name || 'Sem nome'}</div>
                      <div style={{fontSize: '0.75rem', color: 'var(--text-muted)'}}>{u.email}</div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.badge, 
                        backgroundColor: isAdmin ? 'var(--slate-100)' : 'rgba(59, 130, 246, 0.1)',
                        color: isAdmin ? 'var(--slate-600)' : 'var(--primary-light)'
                      }}>
                        {isAdmin ? 'ADMINISTRADOR' : 'FUNCIONÁRIO'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      {isAdmin ? (
                        <span style={{fontSize: '0.875rem', color: 'var(--text-muted)', fontStyle: 'italic'}}>Acesso total irrestrito</span>
                      ) : (
                        <div style={{display: 'flex', gap: 'var(--spacing-md)'}}>
                          <label style={{display: 'flex', alignItems: 'center', gap: 'var(--spacing-sm)', fontSize: '0.875rem', cursor: 'pointer'}}>
                            <input 
                              type="checkbox" 
                              checked={!!perms.canDeleteOrders} 
                              onChange={() => togglePermission(u.id, 'canDeleteOrders', !!perms.canDeleteOrders)}
                            />
                            Pode Excluir Pedido
                          </label>
                          <label style={{display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.875rem', cursor: 'pointer'}}>
                            <input 
                              type="checkbox" 
                              checked={!!perms.canDeletePhotos} 
                              onChange={() => togglePermission(u.id, 'canDeletePhotos', !!perms.canDeletePhotos)}
                            />
                            Pode Excluir Fotos
                          </label>
                        </div>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </main>
  );
}

const styles = {
  header: { marginBottom: 'var(--spacing-2xl)' },
  backLink: { color: 'var(--text-muted)', textDecoration: 'none', fontSize: '0.875rem', fontWeight: '500', display: 'block', marginBottom: 'var(--spacing-md)' },
  title: { fontSize: '2rem', fontWeight: '700', color: 'var(--foreground)' },
  subtitle: { color: 'var(--text-muted)', marginTop: 'var(--spacing-sm)', fontSize: '1.125rem' },
  badge: { padding: 'var(--spacing-xs) var(--spacing-sm)', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' },
  
  grid: { display: 'flex', gap: 'var(--spacing-2xl)', alignItems: 'flex-start', flexWrap: 'wrap' as const },
  card: { borderRadius: '12px', padding: 'var(--spacing-lg)', flex: 1, minWidth: '300px' },
  sectionTitle: { fontSize: '1.25rem', fontWeight: '600', marginBottom: 'var(--spacing-lg)', borderBottom: '1px solid var(--border)', paddingBottom: 'var(--spacing-sm)', color: 'var(--foreground)' },
  
  label: { display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: 'var(--spacing-xs)', color: 'var(--slate-600)' },
  input: { width: '100%', padding: 'var(--spacing-md)', borderRadius: '8px', border: '1px solid var(--border)', fontSize: '1rem', backgroundColor: 'transparent', color: 'var(--foreground)' },
  submitButton: { width: '100%', backgroundColor: 'var(--primary)', color: 'white', padding: 'var(--spacing-md)', borderRadius: '8px', border: 'none', fontSize: '1rem', fontWeight: '600', cursor: 'pointer', marginTop: 'var(--spacing-sm)' },
  
  th: { padding: 'var(--spacing-md)', color: 'var(--text-muted)', fontSize: '0.875rem', fontWeight: '600', backgroundColor: 'rgba(255,255,255,0.05)' },
  td: { padding: 'var(--spacing-md)' }
};
