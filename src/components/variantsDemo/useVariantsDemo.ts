import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { VARIANTS, type DemoVariant } from './data';

/**
 * Local state for the variants demo — the client-side stand-in for the Rivet
 * app's Jotai atoms / MCP bridge. Holds the (mutable) variant list, the
 * selection, inline-rename editing key, and an auto-advance loop.
 *
 * The loop cycles the visible variant every ~1.5s with no user interaction;
 * any deliberate action (click a row, Up/Down arrow, rename, remove) takes
 * over and stops it. No network: everything resolves in memory.
 */
export type VariantsDemoController = {
  variants: DemoVariant[];
  selected: DemoVariant;
  selectedId: string;
  editingId: string | null;
  autoPlay: boolean;
  /** Ids whose fake "generation" has resolved; others render as skeletons. */
  readyIds: Set<string>;
  select: (id: string) => void;
  cycle: (dir: 1 | -1) => void;
  startRename: (id: string) => void;
  commitRename: (id: string, label: string) => void;
  cancelRename: () => void;
  remove: (id: string) => void;
  clearAll: () => void;
  copyDescription: (text: string) => void;
};

const AUTO_ADVANCE_MS = 1500;

// Fake generation timing on first load: every direction starts as a loading
// skeleton, the first resolves after ~1s, and the rest land a couple seconds
// later — mirroring how Rivet streams variants in as they finish generating.
const FIRST_READY_MS = 1000;
const ALL_READY_MS = 2800;

export const useVariantsDemo = (
  options?: { autoPlay?: boolean; initialId?: string; startDelayMs?: number },
): VariantsDemoController => {
  const startDelayMs = Math.max(0, options?.startDelayMs ?? 0);
  const initialId =
    options?.initialId && VARIANTS.some((v) => v.id === options.initialId)
      ? options.initialId
      : VARIANTS[0].id;
  const [overrides, setOverrides] = useState<Record<string, string>>({});
  const [removed, setRemoved] = useState<Set<string>>(new Set());
  const [selectedId, setSelectedId] = useState(initialId);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [autoPlay, setAutoPlay] = useState(options?.autoPlay ?? true);
  const [readyIds, setReadyIds] = useState<Set<string>>(() => new Set());

  // Fake the Rivet generation flow once on mount: skeletons first, then the
  // initial direction resolves, then the remainder stream in. `startDelayMs`
  // offsets the whole sequence so it can be timed after an intro (the hero's
  // agent chat) rather than firing immediately.
  useEffect(() => {
    const ids = VARIANTS.map((v) => v.id);
    const firstId = initialId;
    const firstTimer = setTimeout(
      () => setReadyIds(new Set([firstId])),
      startDelayMs + FIRST_READY_MS,
    );
    const restTimer = setTimeout(
      () => setReadyIds(new Set(ids)),
      startDelayMs + ALL_READY_MS,
    );
    return () => {
      clearTimeout(firstTimer);
      clearTimeout(restTimer);
    };
  }, [initialId, startDelayMs]);

  const variants = useMemo(
    () =>
      VARIANTS.filter((v) => !removed.has(v.id)).map((v) =>
        overrides[v.id] ? { ...v, label: overrides[v.id] } : v,
      ),
    [overrides, removed],
  );

  // Keep a live ref so the interval/keyboard closures always see the current
  // list without re-subscribing on every selection change.
  const variantsRef = useRef(variants);
  variantsRef.current = variants;

  const selected = useMemo(
    () => variants.find((v) => v.id === selectedId) ?? variants[0] ?? VARIANTS[0],
    [variants, selectedId],
  );

  // Auto-advance, no take-over flag.
  const advance = useCallback(() => {
    setSelectedId((cur) => {
      const list = variantsRef.current;
      if (list.length === 0) return cur;
      const idx = list.findIndex((v) => v.id === cur);
      return list[(idx + 1) % list.length]?.id ?? cur;
    });
  }, []);

  // Manual cycle (Up/Down arrows) — takes over from the auto-loop.
  const cycle = useCallback((dir: 1 | -1) => {
    setAutoPlay(false);
    setSelectedId((cur) => {
      const list = variantsRef.current;
      if (list.length === 0) return cur;
      const idx = list.findIndex((v) => v.id === cur);
      const n = (idx + dir + list.length) % list.length;
      return list[n]?.id ?? cur;
    });
  }, []);

  const select = useCallback((id: string) => {
    setAutoPlay(false);
    setSelectedId(id);
  }, []);

  const startRename = useCallback((id: string) => {
    setAutoPlay(false);
    setEditingId(id);
  }, []);
  const cancelRename = useCallback(() => setEditingId(null), []);
  const commitRename = useCallback((id: string, label: string) => {
    const next = label.trim();
    setOverrides((o) => ({ ...o, [id]: next || o[id] || '' }));
    setEditingId(null);
  }, []);

  const remove = useCallback(
    (id: string) => {
      setAutoPlay(false);
      const removedVariant = VARIANTS.find((v) => v.id === id);
      setRemoved((set) => new Set(set).add(id));
      setSelectedId((cur) => {
        if (cur !== id) return cur;
        const next = VARIANTS.find((v) => v.id !== id && !removed.has(v.id));
        return next ? next.id : cur;
      });
      toast(`Removed “${removedVariant?.label ?? 'direction'}”`, {
        action: {
          label: 'Undo',
          onClick: () =>
            setRemoved((set) => {
              const copy = new Set(set);
              copy.delete(id);
              return copy;
            }),
        },
      });
    },
    [removed],
  );

  const clearAll = useCallback(() => {
    setRemoved(new Set());
    setOverrides({});
    setSelectedId(VARIANTS[0].id);
    setAutoPlay(true); // resume the loop on a full reset
    toast('Reset all directions');
  }, []);

  const copyDescription = useCallback((text: string) => {
    void navigator.clipboard?.writeText(text);
    toast('Copied description');
  }, []);

  // Auto-advance loop. Paused once the user takes over, while renaming, or
  // while directions are still "generating" (so it never cycles a skeleton).
  useEffect(() => {
    if (!autoPlay || editingId || variants.length <= 1) return;
    if (readyIds.size < variants.length) return;
    const t = setInterval(advance, AUTO_ADVANCE_MS);
    return () => clearInterval(t);
  }, [autoPlay, editingId, variants.length, readyIds.size, advance]);

  return {
    variants,
    selected,
    selectedId,
    editingId,
    autoPlay,
    readyIds,
    select,
    cycle,
    startRename,
    commitRename,
    cancelRename,
    remove,
    clearAll,
    copyDescription,
  };
};
