"use client";

export function SortableClientHeader({ 
  label, 
  field, 
  currentSort, 
  onSort 
}: { 
  label: string, 
  field: string, 
  currentSort: { key: string, direction: 'asc' | 'desc' },
  onSort: (field: string) => void
}) {
  const isActive = currentSort.key === field;

  return (
    <th onClick={() => onSort(field)} style={styles.th} title={`Ordenar por ${label}`}>
      <div style={styles.content}>
        {label}
        {isActive && (
          <span style={styles.icon}>
            {currentSort.direction === "asc" ? "▲" : "▼"}
          </span>
        )}
      </div>
    </th>
  );
}

const styles = {
  th: {
    textAlign: 'left' as const,
    padding: 'var(--spacing-md)',
    backgroundColor: 'rgba(255,255,255,0.05)',
    borderBottom: '1px solid var(--border)',
    color: 'var(--text-muted)',
    fontWeight: '600',
    fontSize: '0.875rem',
    textTransform: 'uppercase' as const,
    cursor: 'pointer',
    userSelect: 'none' as const,
  },
  content: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  icon: {
    fontSize: '0.75rem',
    color: 'var(--primary-light)',
  }
};
