import { useState, useEffect } from 'react';

const PLACEHOLDER =
  'https://www.themealdb.com/images/media/meals/58ojw51503011446.jpg';

function fallbackForSrc(src) {
  if (src?.includes('themealdb.com')) return PLACEHOLDER;
  const match = src?.match(/foodish-api\.com\/images\/([^/]+)\//);
  const cat = match?.[1] || 'pizza';
  const n = ((src?.length || 0) % 20) + 1;
  return `https://foodish-api.com/images/${cat}/${cat}${n}.jpg`;
}

// Module-level cache so images stay cached across card changes
const imageCache = new Set();

export default function FoodImage({ src, alt = '', className = '', loading = 'lazy' }) {
  const [loaded, setLoaded] = useState(() => imageCache.has(src));
  const [currentSrc, setCurrentSrc] = useState(src);

  // Reset when src changes
  useEffect(() => {
    if (src !== currentSrc) {
      setCurrentSrc(src);
      setLoaded(imageCache.has(src));
    }
  }, [src, currentSrc]);

  return (
    <div className={`relative overflow-hidden ${className}`} style={{ background: 'transparent' }}>
      {/* Skeleton shown while loading */}
      {!loaded && (
        <div
          className="absolute inset-0 bg-zinc-800 animate-pulse"
          style={{ backgroundImage: 'linear-gradient(110deg, #27272a 30%, #3f3f46 50%, #27272a 70%)', backgroundSize: '200% 100%', animation: 'shimmer 1.4s infinite' }}
        />
      )}
      <img
        key={src}
        src={currentSrc}
        alt={alt}
        referrerPolicy="no-referrer"
        loading={loading}
        className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${loaded ? 'opacity-100' : 'opacity-0'}`}
        onLoad={() => {
          imageCache.add(src);
          setLoaded(true);
        }}
        onError={(e) => {
          const img = e.currentTarget;
          const fallback = fallbackForSrc(img.src);
          if (img.src === fallback) {
            setLoaded(true); // show whatever we have
            return;
          }
          img.onerror = null;
          img.src = fallback;
          setCurrentSrc(fallback);
        }}
      />
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}
