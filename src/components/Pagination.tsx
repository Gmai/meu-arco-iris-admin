"use client";

import { useRouter, useSearchParams } from "next/navigation";

export function Pagination({ currentPage, totalPages, limit }: { currentPage: number, totalPages: number, limit: number }) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (newPage: number) => {
    if (newPage < 1) newPage = 1;
    if (newPage > totalPages && totalPages > 0) newPage = totalPages;

    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    router.push('/dashboard?' + params.toString());
  };

  const handleLimitChange = (newLimit: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("limit", newLimit.toString());
    params.set("page", "1"); // Reset to first page
    router.push('/dashboard?' + params.toString());
  };

  return (
    <div style={styles.paginationContainer}>
      <div style={styles.limitSelector}>
        <span style={styles.limitLabel}>Itens por página:</span>
        <select 
          value={limit} 
          onChange={(e) => handleLimitChange(Number(e.target.value))}
          style={styles.limitSelect}
        >
          <option value="10">10</option>
          <option value="20">20</option>
          <option value="40">40</option>
          <option value="100">100</option>
        </select>
      </div>

      <div style={styles.pageControls}>
        <button 
          onClick={() => handlePageChange(1)} 
          disabled={currentPage === 1}
          style={currentPage === 1 ? styles.pageButtonDisabled : styles.pageButton}
          title="Primeira Página"
        >
          &laquo;
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 10)} 
          disabled={currentPage <= 10}
          style={currentPage <= 10 ? styles.pageButtonDisabled : styles.pageButton}
        >
          -10
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 5)} 
          disabled={currentPage <= 5}
          style={currentPage <= 5 ? styles.pageButtonDisabled : styles.pageButton}
        >
          -5
        </button>
        <button 
          onClick={() => handlePageChange(currentPage - 1)} 
          disabled={currentPage === 1}
          style={currentPage === 1 ? styles.pageButtonDisabled : styles.pageButton}
        >
          &lsaquo;
        </button>

        <span style={styles.pageIndicator}>
          Página <strong>{currentPage}</strong> de {totalPages > 0 ? totalPages : 1}
        </span>

        <button 
          onClick={() => handlePageChange(currentPage + 1)} 
          disabled={currentPage >= totalPages}
          style={currentPage >= totalPages ? styles.pageButtonDisabled : styles.pageButton}
        >
          &rsaquo;
        </button>
        <button 
          onClick={() => handlePageChange(currentPage + 5)} 
          disabled={currentPage + 5 > totalPages}
          style={currentPage + 5 > totalPages ? styles.pageButtonDisabled : styles.pageButton}
        >
          +5
        </button>
        <button 
          onClick={() => handlePageChange(currentPage + 10)} 
          disabled={currentPage + 10 > totalPages}
          style={currentPage + 10 > totalPages ? styles.pageButtonDisabled : styles.pageButton}
        >
          +10
        </button>
        <button 
          onClick={() => handlePageChange(totalPages)} 
          disabled={currentPage === totalPages || totalPages === 0}
          style={currentPage === totalPages || totalPages === 0 ? styles.pageButtonDisabled : styles.pageButton}
          title="Última Página"
        >
          &raquo;
        </button>
      </div>
    </div>
  );
}

const styles = {
  paginationContainer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap' as const,
    gap: '1rem',
    marginTop: 'var(--spacing-xl)',
    padding: 'var(--spacing-md)',
    backgroundColor: 'var(--card-bg)',
    borderRadius: '8px',
    border: '1px solid var(--border)',
  },
  limitSelector: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
  limitLabel: {
    fontSize: '0.875rem',
    color: 'var(--text-muted)',
  },
  limitSelect: {
    padding: '0.25rem 0.5rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--foreground)',
    outline: 'none',
  },
  pageControls: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
    flexWrap: 'wrap' as const,
  },
  pageIndicator: {
    fontSize: '0.875rem',
    color: 'var(--foreground)',
    margin: '0 0.5rem',
  },
  pageButton: {
    padding: '0.5rem',
    minWidth: '2.5rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    color: 'var(--foreground)',
    cursor: 'pointer',
    fontWeight: '600',
    transition: 'all 0.2s',
  },
  pageButtonDisabled: {
    padding: '0.5rem',
    minWidth: '2.5rem',
    borderRadius: '4px',
    border: '1px solid var(--border)',
    backgroundColor: 'transparent',
    color: 'var(--text-muted)',
    cursor: 'not-allowed',
    opacity: 0.5,
  }
};
