"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function SortableServerHeader({ label, field }: { label: string, field: string }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const currentField = searchParams.get("sortField") || "createdAt";
  const currentOrder = searchParams.get("sortOrder") || "desc";

  const isActive = currentField === field;

  const handleClick = () => {
    const params = new URLSearchParams(searchParams.toString());
    
    // reset to page 1 on sort change
    params.set("page", "1");
    
    if (isActive) {
      params.set("sortOrder", currentOrder === "asc" ? "desc" : "asc");
    } else {
      params.set("sortField", field);
      params.set("sortOrder", "asc"); // default new sort to asc
    }
    
    router.push('/dashboard?' + params.toString());
  };

  return (
    <th onClick={handleClick} style={styles.th} title={`Ordenar por ${label}`}>
      <div style={styles.content}>
        {label}
        {isActive && (
          <span style={styles.icon}>
            {currentOrder === "asc" ? "▲" : "▼"}
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
