"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteOrderButton({ orderId }: { orderId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Tem certeza que deseja excluir este pedido e todas as suas fotos? Esta ação não pode ser desfeita.")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/orders/${orderId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      alert("Pedido excluído com sucesso.");
      router.push("/dashboard");
      router.refresh();
    } catch (error: any) {
      alert("Erro ao excluir: " + error.message);
      setIsDeleting(false);
    }
  };

  return (
    <button 
      onClick={handleDelete} 
      disabled={isDeleting}
      style={{
        backgroundColor: 'var(--danger)', color: 'white', border: 'none', 
        padding: 'var(--spacing-sm) var(--spacing-md)', borderRadius: '8px', cursor: isDeleting ? 'not-allowed' : 'pointer',
        fontWeight: '600', fontSize: '0.875rem'
      }}
    >
      {isDeleting ? "Excluindo..." : "Excluir Pedido"}
    </button>
  );
}
