import React, { useState } from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export default function OptimizedImage({ src, alt, className, fallback }) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  if (error && fallback) {
    return fallback;
  }

  return (
    <>
      {loading && <Skeleton className={className} />}
      <img
        src={src}
        alt={alt}
        className={`${className} ${loading ? 'hidden' : ''}`}
        onLoad={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setError(true);
        }}
        loading="lazy"
      />
    </>
  );
}