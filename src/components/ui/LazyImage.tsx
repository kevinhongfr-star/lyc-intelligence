import React, { useState, useRef } from 'react';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

interface LazyImageProps {
  src: string;
  alt: string;
  width?: number | string;
  height?: number | string;
  className?: string;
  placeholderClassName?: string;
  rootMargin?: string;
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
}

export function LazyImage({
  src,
  alt,
  width,
  height,
  className = '',
  placeholderClassName = '',
  rootMargin = '200px',
  onLoad,
  onError,
  fallbackSrc,
}: LazyImageProps) {
  const [ref, isVisible] = useIntersectionObserver<HTMLDivElement>({
    rootMargin,
    triggerOnce: true,
  });
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  const handleLoad = () => {
    setLoaded(true);
    onLoad?.();
  };

  const handleError = () => {
    setError(true);
    onError?.();
  };

  const displaySrc = error && fallbackSrc ? fallbackSrc : src;

  return (
    <div
      ref={ref}
      className={`relative overflow-hidden ${placeholderClassName}`}
      style={{ width, height }}
    >
      {!loaded && (
        <div
          className="absolute inset-0 bg-bg-alt animate-pulse"
          aria-hidden="true"
        />
      )}
      {isVisible && (
        <img
          src={displaySrc}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            loaded ? 'opacity-100' : 'opacity-0'
          } ${className}`}
          style={{ width, height }}
          onLoad={handleLoad}
          onError={handleError}
          loading="lazy"
          decoding="async"
        />
      )}
    </div>
  );
}
