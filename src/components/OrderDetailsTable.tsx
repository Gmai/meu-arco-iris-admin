"use client";

import { useState } from "react";
import { SortableClientHeader } from "./SortableClientHeader";

export function OrderDetailsTable({ comparison }: { comparison: { name: string, invQtd: number, detQtd: number, status: string }[] }) {
  const [sortConfig, setSortConfig] = useState<{key: string, direction: 'asc'|'desc'}>({ key: '', direction: 'asc' });

  const handleSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') direction = 'desc';
    setSortConfig({ key, direction });
  };

  const sortedComparison = [...comparison].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    let aVal: any = a[sortConfig.key as keyof typeof a];
    let bVal: any = b[sortConfig.key as keyof typeof b];

    if (aVal < bVal) return sortConfig.direction === 'asc' ? -1 : 1;
    if (aVal > bVal) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  return (
    <table className="responsive-table" style={styles.table}>
      <thead>
        <tr>
          <SortableClientHeader label="Produto" field="name" currentSort={sortConfig} onSort={handleSort} />
          <SortableClientHeader label="Faturado (Nota)" field="invQtd" currentSort={sortConfig} onSort={handleSort} />
          <SortableClientHeader label="Detectado (Foto)" field="detQtd" currentSort={sortConfig} onSort={handleSort} />
          <SortableClientHeader label="Status" field="status" currentSort={sortConfig} onSort={handleSort} />
        </tr>
      </thead>
      <tbody>
        {sortedComparison.map((item, idx) => (
          <tr key={idx} style={styles.tr}>
            <td data-label="Produto" style={styles.tdItem}>{item.name}</td>
            <td data-label="Faturado (Nota)" style={styles.tdItem}>{item.invQtd}</td>
            <td data-label="Detectado (Foto)" style={styles.tdItem}>{item.detQtd}</td>
            <td data-label="Status" style={styles.tdItem}>
              {item.status === 'ok' && <span style={styles.statusOk}>✅ OK</span>}
              {item.status === 'faltando' && <span style={styles.statusAlert}>❌ Faltando ({item.invQtd - item.detQtd})</span>}
              {item.status === 'sobrando' && <span style={styles.statusWarn}>⚠️ Sobrando ({item.detQtd - item.invQtd})</span>}
            </td>
          </tr>
        ))}
        {comparison.length === 0 && (
          <tr><td colSpan={4} style={styles.textMuted}>Nenhum item extraído.</td></tr>
        )}
      </tbody>
    </table>
  );
}

const styles = {
  table: { width: '100%', borderCollapse: 'collapse' as const },
  tr: { borderBottom: '1px solid var(--border)' },
  tdItem: { padding: 'var(--spacing-md)', fontSize: '0.875rem', color: 'var(--foreground)' },
  statusOk: { color: 'var(--success)', fontWeight: '600' },
  statusAlert: { color: 'var(--danger)', fontWeight: '600' },
  statusWarn: { color: 'var(--warning)', fontWeight: '600' },
  textMuted: { color: 'var(--text-muted)', fontStyle: 'italic', padding: 'var(--spacing-md)' },
};
