import { useRef, useEffect, useState } from 'react';
import type { GalleryItem } from '../data';
import PlaceholderArt from './PlaceholderArt';

interface Props {
  item: GalleryItem;
  loading?: boolean;
}

export default function ListItem({ item, loading = false }: Props) {
  const thumbRef = useRef<HTMLDivElement>(null);
  const [dims, setDims] = useState({ w: 44, h: 44 });

  useEffect(() => {
    if (!thumbRef.current) return;
    const ro = new ResizeObserver(([entry]) => {
      const w = entry.contentRect.width;
      setDims({ w, h: w });
    });
    ro.observe(thumbRef.current);
    return () => ro.disconnect();
  }, []);

  return (
    <div className="list-item">
      <div className="list-thumb" ref={thumbRef}>
        {loading ? (
          <div
            className="skeleton"
            style={{ position: 'absolute', inset: 0 }}
          />
        ) : item.image ? (
          <img src={item.image} alt={item.title} className="list-thumb-image" />
        ) : dims.w > 0 ? (
          <PlaceholderArt item={item} width={dims.w} height={dims.h} />
        ) : null}
      </div>
      <div className="list-info">
        {loading ? (
          <>
            <div
              style={{
                height: 9,
                width: '55%',
                borderRadius: 3,
                background: 'var(--skeleton-base)',
                marginBottom: 5,
              }}
            />
            <div
              style={{
                height: 8,
                width: '35%',
                borderRadius: 3,
                background: 'var(--skeleton-base)',
              }}
            />
          </>
        ) : (
          <>
            <div className="list-title">{item.title}</div>
            <div className="list-sub">
              {item.collection} · {item.date}
            </div>
          </>
        )}
      </div>
      <div className="list-right">
        {!loading && (
          <>
            <span className="item-tag">{item.tag}</span>
            <span className="list-size">{item.size}</span>
          </>
        )}
      </div>
    </div>
  );
}
