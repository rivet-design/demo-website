import { useState, useRef, useEffect } from 'react';
import type { GalleryItem as GalleryItemType } from '../data';
import PlaceholderArt from './PlaceholderArt';

interface Props {
  item: GalleryItemType;
  loading?: boolean;
}

export default function GalleryItem({ item, loading = false }: Props) {
  const frameRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 0, h: 0 });

  useEffect(() => {
    if (!frameRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      const h = w * item.aspectRatio;
      setDims({ w, h });
    });
    ro.observe(frameRef.current);
    return () => ro.disconnect();
  }, [item.aspectRatio]);

  return (
    <div className="gallery-item">
      <div
        className={`image-frame ${!loading ? 'loaded' : ''}`}
        ref={frameRef}
        style={{
          aspectRatio: `1 / ${item.aspectRatio}`,
          height: dims.h || undefined,
        }}
      >
        {loading ? (
          <div className="skeleton" />
        ) : (
          <>
            {item.image ? (
              <img src={item.image} alt={item.title} className="item-image" />
            ) : (
              dims.w > 0 && (
                <PlaceholderArt item={item} width={dims.w} height={dims.h} />
              )
            )}
            <div className="item-actions">
              <button className="action-btn" title="Favorite">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <button className="action-btn" title="More">
                <svg
                  width="12"
                  height="12"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <circle cx="12" cy="5" r="1" fill="currentColor" />
                  <circle cx="12" cy="12" r="1" fill="currentColor" />
                  <circle cx="12" cy="19" r="1" fill="currentColor" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
