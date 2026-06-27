import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion } from 'motion/react';
import CommentMarker from './CommentMarker';
import CommentPopover from './CommentPopover';
import type { Comment, DragBox, Pin } from './types';

type Props = {
  /** When true, the layer captures pointer events and the user can drag to comment. */
  active: boolean;
  /** Mock target / preview surface */
  children: ReactNode;
  /** Optional controlled list of comments. If omitted, the layer manages state internally. */
  comments?: Comment[];
  onCommentsChange?: (comments: Comment[]) => void;
  /**
   * Optionally pre-open a draft popover — the popover is anchored at the pin's
   * container-relative position; focus is requested without scrolling, so
   * opening below the fold doesn't jump the page. By default, the draft opens
   * once size is known. With `openInitialDraftOnVisible`, it waits until the
   * panel scrolls into view, which keeps the demo dormant until users find it.
   */
  initialDraft?: { pin: Pin; dragBox?: DragBox };
  /** When true, defer opening `initialDraft` until the panel is visible. */
  openInitialDraftOnVisible?: boolean;
  /**
   * Fires whenever a new draft popover is opened. `source` distinguishes the
   * pre-seeded initial draft (auto-opened) from user-driven drafts created by
   * a tap/click or by drag-rect. Useful for telemetry without coupling the
   * layer to any analytics library.
   */
  onDraftCreated?: (props: {
    source: 'initial' | 'click' | 'drag';
    hasDragBox: boolean;
  }) => void;
  /**
   * CSS selector for an internal scrollable element. When provided, wheel
   * events on the layer (which keeps `pointer-events: none` on children, so
   * scroll wouldn't otherwise reach the child) are forwarded to this element
   * so users can scroll the underlying surface without scrolling the page.
   */
  scrollableSelector?: string;
};

const DRAG_THRESHOLD_PX = 4;

type DragState = {
  startX: number;
  startY: number;
  currentX: number;
  currentY: number;
  exceededThreshold: boolean;
};

type DraftPosition = {
  pin: Pin;
  dragBox?: DragBox;
  /** Container-local cursor position used to anchor the popover */
  popoverAt: { x: number; y: number };
};

const newId = () =>
  `c_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 6)}`;

const CommentLayer = ({
  active,
  children,
  comments: controlledComments,
  onCommentsChange,
  initialDraft,
  openInitialDraftOnVisible = false,
  scrollableSelector,
  onDraftCreated,
}: Props) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [size, setSize] = useState({ width: 0, height: 0 });
  const [internalComments, setInternalComments] = useState<Comment[]>([]);
  const comments = controlledComments ?? internalComments;

  const setComments = useCallback(
    (updater: (prev: Comment[]) => Comment[]) => {
      if (controlledComments && onCommentsChange) {
        onCommentsChange(updater(controlledComments));
      } else {
        setInternalComments((prev) => {
          const next = updater(prev);
          onCommentsChange?.(next);
          return next;
        });
      }
    },
    [controlledComments, onCommentsChange],
  );

  const [drag, setDrag] = useState<DragState | null>(null);
  const [draft, setDraft] = useState<DraftPosition | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [hoveredId, setHoveredId] = useState<string | null>(null);

  // Keep container size in state so child positioning updates on resize.
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const update = () => {
      const rect = el.getBoundingClientRect();
      setSize({ width: rect.width, height: rect.height });
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Seed the open draft once. Guarded with a ref so we don't re-seed if the
  // parent re-renders or the user dismisses the seeded draft. When
  // `openInitialDraftOnVisible` is set, defer opening until the panel scrolls
  // into view — keeps the demo from yelling at users above the fold.
  const didSeedDraftRef = useRef(false);
  useEffect(() => {
    if (didSeedDraftRef.current) return;
    if (!initialDraft) {
      didSeedDraftRef.current = true;
      return;
    }
    if (!size.width || !size.height) return;
    const el = containerRef.current;
    if (!el) return;

    const open = () => {
      if (didSeedDraftRef.current) return;
      setDraft({
        pin: initialDraft.pin,
        dragBox: initialDraft.dragBox,
        popoverAt: {
          x: initialDraft.pin.xPct * size.width,
          y: initialDraft.pin.yPct * size.height,
        },
      });
      didSeedDraftRef.current = true;
      onDraftCreated?.({
        source: 'initial',
        hasDragBox: !!initialDraft.dragBox,
      });
    };

    if (!openInitialDraftOnVisible) {
      open();
      return;
    }
    // Contract the root to a horizontal line at the viewport's vertical
    // center; isIntersecting then flips true once the panel crosses that line,
    // i.e. roughly when the user has scrolled to its midpoint.
    const io = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          open();
          io.disconnect();
        }
      },
      { rootMargin: '-50% 0px -50% 0px', threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [
    initialDraft,
    openInitialDraftOnVisible,
    size.width,
    size.height,
    onDraftCreated,
  ]);

  // Forward wheel events to an internal scrollable element so users can scroll
  // the underlying surface (e.g. a gallery) while comment mode keeps
  // `pointer-events: none` on children — wheel events would otherwise scroll
  // the page since they can't reach the child via the layer.
  useEffect(() => {
    const el = containerRef.current;
    if (!el || !active || !scrollableSelector) return;

    const handleWheel = (e: WheelEvent) => {
      const scrollable = el.querySelector(scrollableSelector) as HTMLElement | null;
      if (!scrollable) return;
      // Only intercept if the scrollable can actually scroll in that direction
      // — otherwise let the page scroll naturally past the demo.
      const canScrollY =
        e.deltaY > 0
          ? scrollable.scrollTop + scrollable.clientHeight < scrollable.scrollHeight - 1
          : scrollable.scrollTop > 0;
      const canScrollX =
        e.deltaX > 0
          ? scrollable.scrollLeft + scrollable.clientWidth < scrollable.scrollWidth - 1
          : scrollable.scrollLeft > 0;
      if (!canScrollY && !canScrollX) return;
      e.preventDefault();
      scrollable.scrollBy({ top: e.deltaY, left: e.deltaX });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [active, scrollableSelector]);

  const localPoint = useCallback((e: React.PointerEvent | PointerEvent) => {
    const rect = containerRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  }, []);

  // Pointer move/up are bound to window so the drag survives leaving the surface.
  useEffect(() => {
    if (!drag) return;

    const handleMove = (e: PointerEvent) => {
      const { x, y } = localPoint(e);
      const dx = x - drag.startX;
      const dy = y - drag.startY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setDrag({
        ...drag,
        currentX: x,
        currentY: y,
        exceededThreshold: drag.exceededThreshold || dist >= DRAG_THRESHOLD_PX,
      });
    };

    const handleUp = (e: PointerEvent) => {
      const { x, y } = localPoint(e);
      const exceeded =
        drag.exceededThreshold ||
        Math.hypot(x - drag.startX, y - drag.startY) >= DRAG_THRESHOLD_PX;

      if (!exceeded) {
        // Treat as a click — pin a comment at the press point.
        if (size.width && size.height) {
          setDraft({
            pin: { xPct: drag.startX / size.width, yPct: drag.startY / size.height },
            popoverAt: { x: drag.startX, y: drag.startY },
          });
          onDraftCreated?.({ source: 'click', hasDragBox: false });
        }
        setDrag(null);
        return;
      }

      const left = Math.min(drag.startX, x);
      const top = Math.min(drag.startY, y);
      const width = Math.abs(x - drag.startX);
      const height = Math.abs(y - drag.startY);

      if (size.width && size.height) {
        const dragBox: DragBox = {
          leftPct: left / size.width,
          topPct: top / size.height,
          widthPct: width / size.width,
          heightPct: height / size.height,
        };
        const pin: Pin = { xPct: x / size.width, yPct: y / size.height };
        setDraft({
          pin,
          dragBox,
          popoverAt: { x, y },
        });
        onDraftCreated?.({ source: 'drag', hasDragBox: true });
      }
      setDrag(null);
    };

    window.addEventListener('pointermove', handleMove);
    window.addEventListener('pointerup', handleUp);
    return () => {
      window.removeEventListener('pointermove', handleMove);
      window.removeEventListener('pointerup', handleUp);
    };
  }, [drag, localPoint, size, onDraftCreated]);

  const handlePointerDown = (e: React.PointerEvent) => {
    if (!active) return;
    // A pointer-down that reaches the layer is always OUTSIDE the popover (it
    // stops propagation), so dismiss any open draft / editor — matching Rivet
    // Core's click-outside behavior (its popover has no explicit Cancel button).
    if (draft) {
      setDraft(null);
      return;
    }
    if (editingId) {
      setEditingId(null);
      return;
    }
    e.preventDefault();
    const { x, y } = localPoint(e);
    setDrag({
      startX: x,
      startY: y,
      currentX: x,
      currentY: y,
      exceededThreshold: false,
    });
  };

  const submitDraft = (instruction: string) => {
    if (!draft) return;
    const c: Comment = {
      id: newId(),
      pin: draft.pin,
      dragBox: draft.dragBox,
      instruction,
      status: 'pending',
      createdAt: Date.now(),
    };
    setComments((prev) => [...prev, c]);
    setDraft(null);
  };

  const editingComment = editingId ? comments.find((c) => c.id === editingId) ?? null : null;

  const updateEditing = (instruction: string) => {
    if (!editingComment) return;
    setComments((prev) =>
      prev.map((c) =>
        c.id === editingComment.id ? { ...c, instruction } : c,
      ),
    );
    setEditingId(null);
  };

  const deleteEditing = () => {
    if (!editingComment) return;
    setComments((prev) => prev.filter((c) => c.id !== editingComment.id));
    setEditingId(null);
  };

  // Live drag-box rect (in container px) while user is dragging past threshold.
  const liveBox = useMemo(() => {
    if (!drag || !drag.exceededThreshold) return null;
    return {
      left: Math.min(drag.startX, drag.currentX),
      top: Math.min(drag.startY, drag.currentY),
      width: Math.abs(drag.currentX - drag.startX),
      height: Math.abs(drag.currentY - drag.startY),
    };
  }, [drag]);

  const editingPos = editingComment
    ? {
        x: editingComment.pin.xPct * size.width,
        y: editingComment.pin.yPct * size.height,
      }
    : null;

  const editingBoxPx = editingComment?.dragBox
    ? {
        left: editingComment.dragBox.leftPct * size.width,
        top: editingComment.dragBox.topPct * size.height,
        width: editingComment.dragBox.widthPct * size.width,
        height: editingComment.dragBox.heightPct * size.height,
      }
    : null;

  const hoveredComment = hoveredId
    ? comments.find((c) => c.id === hoveredId)
    : null;
  const hoveredBoxPx = hoveredComment?.dragBox
    ? {
        left: hoveredComment.dragBox.leftPct * size.width,
        top: hoveredComment.dragBox.topPct * size.height,
        width: hoveredComment.dragBox.widthPct * size.width,
        height: hoveredComment.dragBox.heightPct * size.height,
      }
    : null;

  return (
    <div
      ref={containerRef}
      // `rivet-comments` scopes the comment system's CSS variables (--main, --primary, etc.)
      // so they don't collide with host design tokens defined at :root.
      className="rivet-comments"
      onPointerDown={handlePointerDown}
      style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        cursor: active && !draft && !editingId ? 'crosshair' : 'default',
        userSelect: active ? 'none' : 'auto',
        touchAction: active ? 'none' : 'auto',
      }}
    >
      {/* Target content — the “app” being commented on */}
      <div
        style={{
          width: '100%',
          height: '100%',
          pointerEvents: active ? 'none' : 'auto',
        }}
      >
        {children}
      </div>

      {/* Live drag box while user is dragging */}
      <AnimatePresence>
        {liveBox ? (
          <motion.div
            key="live-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              left: liveBox.left,
              top: liveBox.top,
              width: liveBox.width,
              height: liveBox.height,
              border: '1px dashed var(--primary)',
              background: 'var(--primary-soft)',
              borderRadius: 2,
              boxSizing: 'border-box',
              zIndex: 30,
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Hovered or editing drag-box highlight */}
      <AnimatePresence>
        {hoveredBoxPx && !editingId ? (
          <motion.div
            key="hover-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              left: hoveredBoxPx.left,
              top: hoveredBoxPx.top,
              width: hoveredBoxPx.width,
              height: hoveredBoxPx.height,
              border: '1px dashed var(--primary)',
              background: 'var(--primary-soft)',
              borderRadius: 2,
              boxSizing: 'border-box',
              zIndex: 30,
            }}
          />
        ) : null}
        {editingBoxPx ? (
          <motion.div
            key="editing-box"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.08 }}
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              left: editingBoxPx.left,
              top: editingBoxPx.top,
              width: editingBoxPx.width,
              height: editingBoxPx.height,
              border: '1px dashed var(--primary)',
              background: 'var(--primary-soft)',
              borderRadius: 2,
              boxSizing: 'border-box',
              zIndex: 30,
            }}
          />
        ) : null}
      </AnimatePresence>

      {/* Markers */}
      {comments.map((c, i) => {
        if (editingId === c.id) return null;
        return (
          <CommentMarker
            key={c.id}
            comment={c}
            index={i}
            position={{
              x: c.pin.xPct * size.width,
              y: c.pin.yPct * size.height,
            }}
            containerHeight={size.height || 1}
            onEdit={(id) => setEditingId(id)}
            onHover={() => setHoveredId(c.id)}
            onHoverEnd={() => setHoveredId((prev) => (prev === c.id ? null : prev))}
          />
        );
      })}

      {/* New-comment popover */}
      <AnimatePresence>
        {draft ? (
          <CommentPopover
            position={draft.popoverAt}
            containerWidth={size.width}
            containerHeight={size.height}
            onSubmit={submitDraft}
            onCancel={() => setDraft(null)}
          />
        ) : null}
      </AnimatePresence>

      {/* Edit popover */}
      <AnimatePresence>
        {editingComment && editingPos ? (
          <CommentPopover
            key={editingComment.id}
            position={editingPos}
            containerWidth={size.width}
            containerHeight={size.height}
            initialValue={editingComment.instruction}
            canDelete
            onSubmit={updateEditing}
            onCancel={() => setEditingId(null)}
            onDelete={deleteEditing}
          />
        ) : null}
      </AnimatePresence>
    </div>
  );
};

export default CommentLayer;
