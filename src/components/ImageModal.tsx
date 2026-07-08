"use client";

import { useEffect, useState } from "react";

export function ImageModal({ src, onClose }: { src: string | null; onClose: () => void }) {
  const [scale, setScale] = useState(1);

  useEffect(() => {
    // Bloquear o scroll da página de fundo
    document.body.style.overflow = 'hidden';

    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    
    return () => {
      document.body.style.overflow = 'auto';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const handleWheel = (e: React.WheelEvent) => {
    // Evitar propagação
    e.stopPropagation();
    const zoomFactor = e.deltaY * -0.001;
    setScale(prev => Math.min(Math.max(0.5, prev + zoomFactor), 10)); // Zoom máximo de 10x, mínimo 0.5x
  };

  if (!src) return null;

  return (
    <div 
      role="dialog"
      aria-modal="true"
      onClick={onClose}
      onWheel={handleWheel}
      style={{
        position: 'fixed',
        top: 0, left: 0, width: '100vw', height: '100vh',
        backgroundColor: 'rgba(0, 0, 0, 0.85)',
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2rem',
        cursor: 'zoom-out'
      }}
    >
      <img 
        src={src} 
        alt="Ampliado" 
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain',
          borderRadius: '8px',
          boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
          transform: `scale(${scale})`,
          transition: 'transform 0.1s ease-out'
        }} 
        onClick={(e) => e.stopPropagation()} // Impede que clicar na imagem feche o modal
      />
      
      <button
        onClick={onClose}
        style={{
          position: 'absolute',
          top: '2rem',
          right: '2rem',
          backgroundColor: 'transparent',
          color: 'white',
          border: 'none',
          fontSize: '2rem',
          cursor: 'pointer',
          fontWeight: 'bold',
          textShadow: '0 2px 4px rgba(0,0,0,0.5)'
        }}
      >
        ×
      </button>
    </div>
  );
}
