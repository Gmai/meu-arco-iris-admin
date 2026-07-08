"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function DeleteImageButton({ imageId }: { imageId: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm("Remover esta foto definitivamente?")) return;

    setIsDeleting(true);
    try {
      const res = await fetch(`/api/images/${imageId}`, {
        method: "DELETE",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

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
      title="Excluir Imagem"
      style={{
        position: 'absolute', top: '8px', right: '8px',
        backgroundColor: 'var(--danger)', color: 'white', border: 'none', 
        width: '32px', height: '32px', borderRadius: '50%', cursor: isDeleting ? 'not-allowed' : 'pointer',
        display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold'
      }}
    >
      {isDeleting ? "..." : "X"}
    </button>
  );
}
