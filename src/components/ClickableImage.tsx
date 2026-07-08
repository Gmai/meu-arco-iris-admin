"use client";

import { useState } from "react";
import { ImageModal } from "./ImageModal";

export function ClickableImage({ src, alt, style }: { src: string, alt: string, style?: any }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <img 
        src={src} 
        alt={alt} 
        role="button"
        tabIndex={0}
        style={{...style, cursor: 'zoom-in'}} 
        onClick={() => setIsOpen(true)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(true);
          }
        }}
      />
      {isOpen && <ImageModal src={src} onClose={() => setIsOpen(false)} />}
    </>
  );
}
