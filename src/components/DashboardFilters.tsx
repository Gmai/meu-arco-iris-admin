"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";

export function DashboardFilters({ initialSearch, initialStatus }: { initialSearch: string, initialStatus: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (search) params.set("search", search);
    else params.delete("search");
    
    if (status) params.set("status", status);
    else params.delete("status");
    
    // reset page to 1 when a new filter is applied
    params.set("page", "1");
    
    
    // soft navigation without full page reload
    router.push('/dashboard?' + params.toString());
  };

  return (
    <form onSubmit={handleSubmit} style={styles.filterSection} aria-label="Filtros de busca">
      <input 
        value={search} 
        onChange={e => setSearch(e.target.value)} 
        style={styles.filterInput} 
        type="text" 
        placeholder="Buscar por número do pedido ou cliente..." 
        aria-label="Buscar por número ou cliente"
      />
      <select 
        value={status} 
        onChange={e => setStatus(e.target.value)} 
        style={styles.filterSelect}
        aria-label="Filtrar por status"
      >
        <option value="">Todos os status</option>
        <option value="VALID">Válidos</option>
        <option value="DIVERGENT">Com Divergência</option>
      </select>
      <button type="submit" style={styles.filterButton}>Filtrar</button>
    </form>
  );
}

const styles = {
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
  }
};
