import React, { useState } from 'react';

interface ProductImageProps {
  src?: string;
  alt: string;
  className?: string;
  onClick?: () => void;
  aspectRatio?: '3/4' | '4/5' | 'square';
  objectPosition?: string;
  children?: React.ReactNode;
}

export function ProductImage({
  src,
  alt,
  className = '',
  onClick,
  aspectRatio = '4/5',
  objectPosition = 'center top',
  children
}: ProductImageProps) {
  const [didError, setDidError] = useState(false);

  const aspectClass = 
    aspectRatio === '3/4' ? 'aspect-[3/4]' :
    aspectRatio === 'square' ? 'aspect-square' :
    'aspect-[4/5]';

  // SVG de fallback para imagen no disponible
  const fallbackSrc = 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="900" height="1125" viewBox="0 0 900 1125"><rect width="900" height="1125" fill="%23f3f4f6"/><text x="450" y="540" text-anchor="middle" font-family="Arial, sans-serif" font-size="34" fill="%239ca3af">DAMABELLA</text><text x="450" y="592" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" fill="%23b6bcc6">Imagen no disponible</text></svg>';

  const handleImageError = () => {
    setDidError(true);
  };

  return (
    <div
      className={`relative w-full overflow-hidden bg-gray-100 ${aspectClass} ${className}`}
      onClick={onClick}
      style={{ cursor: onClick ? 'pointer' : 'default' }}
    >
      <img
        src={didError || !src ? fallbackSrc : src}
        alt={alt}
        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        style={{ objectPosition }}
        onError={handleImageError}
      />
      {children}
    </div>
  );
}
