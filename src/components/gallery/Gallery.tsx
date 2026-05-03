import { useState, useEffect, type CSSProperties } from 'react';
import { COLLECTIONS, ITEMS } from './data';
import GalleryItem from './components/GalleryItem';
import ListItem from './components/ListItem';
import './gallery.css';

type View = 'grid' | 'list' | 'bento';
type Cols = 2 | 3 | 4;

type Props = {
  /**
   * Optional variant overrides:
   * - `cssVars`: applied as inline style on the `.rivet-gallery` wrapper.
   *   Existing classes consume these via `var(--…)`, so recoloring is a
   *   wrapper-level diff rather than per-element edits.
   * - `layout.view` / `layout.cols`: override the gallery's internal toggle
   *   state. Falls back to internal state when undefined so the toggle UI
   *   still works when no variant is being applied.
   */
  variant?: {
    cssVars?: Record<string, string>;
    layout?: { view?: View; cols?: Cols };
  };
};

/**
 * Embeddable copy of examples/gallery in the rivet repo.
 * - Wrapped in .rivet-gallery so its tokens, body resets, and shimmer keyframe
 *   stay scoped (they would otherwise nuke the host landing page).
 * - Always uses generated SVG placeholder art (no image asset bundling).
 * - When wrapped by an interaction layer that disables pointer events on
 *   children, internal toggles stay rendered but inert — the variant prop
 *   then drives layout from the outside.
 */
export default function Gallery({ variant }: Props = {}) {
  const [activeCollection, setActiveCollection] = useState('All Works');
  const [activeTab, setActiveTab] = useState('Library');
  const [internalView, setView] = useState<View>('grid');
  const [internalCols, setCols] = useState<Cols>(3);
  const [sort, setSort] = useState('date-desc');
  const [loading, setLoading] = useState(true);

  // Variant overrides win, internal state is the fallback.
  const view = variant?.layout?.view ?? internalView;
  const cols = variant?.layout?.cols ?? internalCols;

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1800);
    return () => clearTimeout(t);
  }, []);

  const handleCollectionChange = (label: string) => {
    setLoading(true);
    setActiveCollection(label);
    setTimeout(() => setLoading(false), 900);
  };

  const filtered =
    activeCollection === 'All Works'
      ? ITEMS
      : ITEMS.filter((i) => i.collection === activeCollection);

  const collectionMeta = COLLECTIONS.find((c) => c.label === activeCollection);

  return (
    <div className="rivet-gallery">
      <div className="app">
        {/* Topbar */}
        <header className="topbar">
          <div className="topbar-left">
            <span className="wordmark">Archive</span>
            <div className="topbar-tabs">
              {['Library', 'Albums', 'Projects', 'Export'].map((t) => (
                <button
                  key={t}
                  className={`tab ${activeTab === t ? 'active' : ''}`}
                  onClick={() => setActiveTab(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>
          <div className="topbar-right">
            <button className="icon-btn" title="Search">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="11" cy="11" r="8" />
                <line x1="21" y1="21" x2="16.65" y2="16.65" />
              </svg>
            </button>
            <button className="icon-btn" title="Import">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <polyline points="17 8 12 3 7 8" />
                <line x1="12" y1="3" x2="12" y2="15" />
              </svg>
            </button>
            <div
              className="avatar-circle"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '11px',
                fontWeight: 600,
                color: 'var(--text-primary)',
                background: 'var(--surface-2)',
              }}
            >
              S.G
            </div>
          </div>
        </header>

        {/* Sidebar */}
        <aside className="sidebar">
          <div>
            <div className="sidebar-section-title">Collections</div>
            <div className="sidebar-items">
              {COLLECTIONS.map((c) => (
                <div
                  key={c.label}
                  className={`sidebar-item ${activeCollection === c.label ? 'active' : ''}`}
                  onClick={() => handleCollectionChange(c.label)}
                >
                  <span
                    className="sidebar-item-dot"
                    style={{ background: c.color }}
                  />
                  {c.label}
                  <span className="sidebar-item-count">{c.count}</span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <div className="sidebar-section-title">Smart Albums</div>
            <div className="sidebar-items">
              {['Favorites', 'Recent Imports', 'Untagged', 'RAW Only'].map(
                (label) => (
                  <div key={label} className="sidebar-item">
                    <svg
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      style={{ color: 'var(--text-muted)', flexShrink: 0 }}
                    >
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                    </svg>
                    {label}
                  </div>
                ),
              )}
            </div>
          </div>
        </aside>

        {/* Main — variant cssVars are applied here (not the wrapper) so the
            palette change is localized to the gallery section. Topbar and
            sidebar keep their default theme. */}
        <main
          className="content"
          style={variant?.cssVars as CSSProperties | undefined}
        >
          <div className="content-header">
            <div>
              <div className="content-title">{activeCollection}</div>
              <div className="content-meta">
                {filtered.length} items · {collectionMeta?.count ?? 0} total
              </div>
            </div>
            <div className="view-controls">
              <select
                className="sort-select"
                value={sort}
                onChange={(e) => setSort(e.target.value)}
              >
                <option value="date-desc">Newest first</option>
                <option value="date-asc">Oldest first</option>
                <option value="name-asc">Name A–Z</option>
                <option value="size-desc">Largest first</option>
              </select>
              {view === 'grid' && (
                <div style={{ display: 'flex', gap: 2 }}>
                  {([2, 3, 4] as Cols[]).map((n) => (
                    <button
                      key={n}
                      className={`view-toggle-btn ${cols === n ? 'active' : ''}`}
                      onClick={() => setCols(n)}
                      title={`${n} columns`}
                    >
                      <svg
                        width="12"
                        height="12"
                        viewBox="0 0 12 12"
                        fill="currentColor"
                      >
                        {n === 2 && (
                          <>
                            <rect x="0" y="0" width="5" height="5" rx="1" />
                            <rect x="7" y="0" width="5" height="5" rx="1" />
                            <rect x="0" y="7" width="5" height="5" rx="1" />
                            <rect x="7" y="7" width="5" height="5" rx="1" />
                          </>
                        )}
                        {n === 3 && (
                          <>
                            <rect x="0" y="0" width="3" height="3" rx="0.5" />
                            <rect x="4.5" y="0" width="3" height="3" rx="0.5" />
                            <rect x="9" y="0" width="3" height="3" rx="0.5" />
                            <rect x="0" y="4.5" width="3" height="3" rx="0.5" />
                            <rect x="4.5" y="4.5" width="3" height="3" rx="0.5" />
                            <rect x="9" y="4.5" width="3" height="3" rx="0.5" />
                            <rect x="0" y="9" width="3" height="3" rx="0.5" />
                            <rect x="4.5" y="9" width="3" height="3" rx="0.5" />
                            <rect x="9" y="9" width="3" height="3" rx="0.5" />
                          </>
                        )}
                        {n === 4 && (
                          <>
                            <rect x="0" y="0" width="2" height="2" rx="0.5" />
                            <rect x="3.3" y="0" width="2" height="2" rx="0.5" />
                            <rect x="6.6" y="0" width="2" height="2" rx="0.5" />
                            <rect x="10" y="0" width="2" height="2" rx="0.5" />
                            <rect x="0" y="3.3" width="2" height="2" rx="0.5" />
                            <rect x="3.3" y="3.3" width="2" height="2" rx="0.5" />
                            <rect x="6.6" y="3.3" width="2" height="2" rx="0.5" />
                            <rect x="10" y="3.3" width="2" height="2" rx="0.5" />
                          </>
                        )}
                      </svg>
                    </button>
                  ))}
                </div>
              )}
              <div className="view-toggle">
                <button
                  className={`view-toggle-btn ${view === 'grid' ? 'active' : ''}`}
                  onClick={() => setView('grid')}
                  title="Grid view"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <rect x="3" y="3" width="7" height="7" />
                    <rect x="14" y="3" width="7" height="7" />
                    <rect x="3" y="14" width="7" height="7" />
                    <rect x="14" y="14" width="7" height="7" />
                  </svg>
                </button>
                <button
                  className={`view-toggle-btn ${view === 'list' ? 'active' : ''}`}
                  onClick={() => setView('list')}
                  title="List view"
                >
                  <svg
                    width="12"
                    height="12"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <line x1="8" y1="6" x2="21" y2="6" />
                    <line x1="8" y1="12" x2="21" y2="12" />
                    <line x1="8" y1="18" x2="21" y2="18" />
                    <line x1="3" y1="6" x2="3.01" y2="6" />
                    <line x1="3" y1="12" x2="3.01" y2="12" />
                    <line x1="3" y1="18" x2="3.01" y2="18" />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          <div className="gallery-scroll">
            {view === 'grid' || view === 'bento' ? (
              <div
                className={`gallery-grid ${
                  view === 'bento' ? 'bento' : `cols-${cols}`
                }`}
              >
                {(loading ? Array.from({ length: 10 }) : filtered).map(
                  (item, i) => (
                    <GalleryItem
                      key={loading ? i : (item as (typeof ITEMS)[0]).id}
                      item={
                        loading
                          ? ITEMS[i % ITEMS.length]
                          : (item as (typeof ITEMS)[0])
                      }
                      loading={loading}
                    />
                  ),
                )}
              </div>
            ) : (
              <div className="gallery-list">
                {(loading ? Array.from({ length: 10 }) : filtered).map(
                  (item, i) => (
                    <ListItem
                      key={loading ? i : (item as (typeof ITEMS)[0]).id}
                      item={
                        loading
                          ? ITEMS[i % ITEMS.length]
                          : (item as (typeof ITEMS)[0])
                      }
                      loading={loading}
                    />
                  ),
                )}
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
