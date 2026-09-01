import {
  useCallback,
  useMemo,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
  type ReactNode,
} from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  CaretDown,
  Copy,
  FolderOpen,
  FolderSimple,
  MagnifyingGlass,
  PencilSimple,
  SidebarSimple,
  Trash,
} from '@phosphor-icons/react';
import { cn } from './cn';
import { springs } from './springs';
import SparkleLoader from './SparkleLoader';
import {
  useProximityHover,
  useRegisterProximityItem,
} from './useProximityHover';
import { type DemoVariant } from './data';
import type { VariantsDemoController } from './useVariantsDemo';

/**
 * Faithful port of the Rivet core-UI variants panel (AgentVariantsPanel),
 * scoped down to what a static demo needs: header, search, the proximity-hover
 * variant table, inline rename, and the copy/rename/remove action cluster.
 * Backend coupling (atoms / MCP / dev servers / history) is replaced by the
 * local `useVariantsDemo` controller. Fluid-functionalism tokens come from the
 * `.rivet-variants` scope on the root.
 */

// --- Inline rename input (port of RenameInput) ---------------------------
const RenameInput = ({
  initial,
  onCommit,
  onCancel,
}: {
  initial: string;
  onCommit: (value: string) => void;
  onCancel: () => void;
}) => {
  const [value, setValue] = useState(initial);
  const doneRef = useRef(false);

  const focusOnMount = useCallback((el: HTMLInputElement | null) => {
    if (!el) return;
    el.focus();
    el.select();
  }, []);

  const finish = (commit: boolean) => {
    if (doneRef.current) return;
    doneRef.current = true;
    if (commit) onCommit(value);
    else onCancel();
  };

  return (
    <input
      ref={focusOnMount}
      type="text"
      value={value}
      maxLength={120}
      aria-label="Rename direction"
      onChange={(e) => setValue(e.target.value)}
      onKeyDown={(e) => {
        e.stopPropagation();
        if (e.key === 'Enter') {
          e.preventDefault();
          finish(true);
        } else if (e.key === 'Escape') {
          e.preventDefault();
          finish(false);
        }
      }}
      onBlur={() => finish(true)}
      onClick={(e) => e.stopPropagation()}
      className="w-full rounded border border-content-muted/40 bg-[var(--main)] px-1.5 py-0.5 text-sm font-medium text-content focus:outline-none focus:ring-1 focus:ring-content-muted/50"
    />
  );
};

// --- Variant row (port of VariantRow) ------------------------------------
type RowProps = {
  variant: DemoVariant;
  index: number;
  isSelected: boolean;
  isEditing: boolean;
  /** False while the direction is still "generating" — renders a skeleton. */
  ready: boolean;
  registerItem: (index: number, el: HTMLElement | null) => void;
  onSelect: (id: string) => void;
  onStartRename: (id: string) => void;
  onCommitRename: (id: string, label: string) => void;
  onCancelRename: () => void;
  onCopyDescription: (text: string) => void;
  onRemove: (id: string) => void;
};

const VariantRow = ({
  variant,
  index,
  isSelected,
  isEditing,
  ready,
  registerItem,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onCopyDescription,
  onRemove,
}: RowProps) => {
  const rowRef = useRef<HTMLLIElement>(null);
  useRegisterProximityItem(registerItem, index, rowRef);

  // Skeleton direction — port of Rivet core's DirectionSkeletonRow. The loader
  // sits outside animate-pulse so its own motion isn't dampened. Keeps the same
  // li wrapper so the list doesn't reflow (or lose hover indices) on resolve.
  if (!ready) {
    return (
      <li
        ref={rowRef}
        data-proximity-index={index}
        className="group relative z-10"
      >
        <div
          aria-hidden="true"
          className="flex w-full items-start gap-2 rounded-md py-2 pl-[33px] pr-3"
        >
          <SparkleLoader className="mt-0.5 shrink-0 text-sm text-content-muted" />
          <span className="min-w-0 flex-1 animate-pulse">
            <span className="flex items-center gap-2">
              <span className="h-3.5 w-28 rounded bg-content-muted/15" />
            </span>
            <span className="mt-1.5 flex">
              <span className="h-2.5 w-full max-w-[14rem] rounded bg-content-muted/10" />
            </span>
          </span>
        </div>
      </li>
    );
  }

  if (isEditing) {
    return (
      <li
        ref={rowRef}
        data-proximity-index={index}
        className="group relative z-10"
      >
        <div className="flex w-full items-start gap-2 rounded-md bg-[var(--main-input)] py-2 pl-[33px] pr-3">
          <span className="min-w-0 flex-1">
            <RenameInput
              initial={variant.label}
              onCommit={(value) => onCommitRename(variant.id, value)}
              onCancel={onCancelRename}
            />
            <span className="mt-1 line-clamp-2 block text-xs leading-snug text-content-muted">
              {variant.brief}
            </span>
          </span>
        </div>
      </li>
    );
  }

  return (
    <li
      ref={rowRef}
      data-proximity-index={index}
      className="group relative z-10"
    >
      <div
        role="button"
        tabIndex={0}
        data-variant-id={variant.id}
        onClick={() => {
          const selection = window.getSelection();
          if (selection && !selection.isCollapsed) return;
          onSelect(variant.id);
        }}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            e.stopPropagation();
            onSelect(variant.id);
          }
        }}
        aria-pressed={isSelected}
        className={cn(
          'flex w-full cursor-pointer items-start gap-2 rounded-md py-2 pl-[33px] pr-3 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40',
          isSelected &&
            'bg-[var(--main-input)] ring-1 ring-inset ring-content-muted/40',
        )}
      >
        <span className="min-w-0 flex-1">
          <span className="flex items-center gap-2">
            <span
              title="Double-click to rename"
              onDoubleClick={(e) => {
                e.stopPropagation();
                onStartRename(variant.id);
              }}
              className="min-w-0 flex-1 cursor-pointer select-text truncate text-sm font-medium text-content"
            >
              {variant.label}
            </span>
          </span>
          <span className="mt-0.5 line-clamp-2 block cursor-pointer select-text text-xs leading-snug text-content-muted">
            {variant.brief}
          </span>
        </span>
      </div>

      {/* Hover action cluster — siblings of the row so pointer events don't
          trigger selection. */}
      <div
        className={cn(
          'absolute right-2 top-1.5 flex items-center gap-0.5 transition-opacity duration-150',
          'pointer-events-none opacity-0 group-hover:pointer-events-auto group-hover:opacity-100 has-[:focus-visible]:pointer-events-auto has-[:focus-visible]:opacity-100',
        )}
      >
        <button
          type="button"
          aria-label="Copy description"
          title="Copy description"
          onClick={(e) => {
            e.stopPropagation();
            onCopyDescription(variant.brief);
          }}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-content-muted hover:bg-[var(--main-hover)] hover:text-content focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40"
        >
          <Copy size={13} weight="bold" />
        </button>
        <button
          type="button"
          aria-label="Rename direction"
          title="Rename direction"
          onClick={(e) => {
            e.stopPropagation();
            onStartRename(variant.id);
          }}
          className="flex h-6 w-6 cursor-pointer items-center justify-center rounded text-content-muted hover:bg-[var(--main-hover)] hover:text-content focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40"
        >
          <PencilSimple size={13} weight="bold" />
        </button>
        <button
          type="button"
          aria-label="Remove direction"
          title="Remove direction"
          onClick={(e) => {
            e.stopPropagation();
            onRemove(variant.id);
          }}
          className="ml-1 flex h-6 w-6 items-center justify-center rounded text-content-muted hover:bg-[var(--main-hover)] hover:text-content focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40"
        >
          <Trash size={13} weight="bold" />
        </button>
      </div>
    </li>
  );
};

// --- Variant table (port of VariantTable: proximity-hover overlay) -------
type VariantTableProps = {
  variants: DemoVariant[];
  selectedId: string;
  editingId: string | null;
  readyIds: Set<string>;
  onSelect: VariantsDemoController['select'];
  onStartRename: VariantsDemoController['startRename'];
  onCommitRename: VariantsDemoController['commitRename'];
  onCancelRename: VariantsDemoController['cancelRename'];
  onCopyDescription: VariantsDemoController['copyDescription'];
  onRemove: VariantsDemoController['remove'];
};

const VariantTable = ({
  variants,
  selectedId,
  editingId,
  readyIds,
  onSelect,
  onStartRename,
  onCommitRename,
  onCancelRename,
  onCopyDescription,
  onRemove,
}: VariantTableProps) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { activeIndex, itemRects, sessionRef, handlers, registerItem } =
    useProximityHover<HTMLDivElement>(containerRef);
  const activeRect = activeIndex !== null ? itemRects[activeIndex] : null;

  return (
    <div
      ref={containerRef}
      className="relative cursor-pointer"
      onMouseEnter={handlers.onMouseEnter}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
      // The proximity overlay highlights the nearest row even while the
      // cursor is in the container's padding / the gap between rows — but the
      // row button doesn't extend there, so a click in that zone used to do
      // nothing. Catch those clicks here and select the highlighted row, so
      // wherever the hover highlight shows, clicking selects it. Clicks that
      // land ON a row (or its action buttons / rename input) are handled by
      // the row itself.
      onClick={(e) => {
        if (activeIndex === null) return;
        if ((e.target as HTMLElement).closest('[data-proximity-index]')) return;
        const v = variants[activeIndex];
        if (!v || !readyIds.has(v.id)) return;
        const selection = window.getSelection();
        if (selection && !selection.isCollapsed) return;
        onSelect(v.id);
      }}
    >
      <AnimatePresence>
        {activeRect && (
          <motion.div
            key={sessionRef.current}
            className="pointer-events-none absolute z-0 rounded-md bg-[var(--hover)]"
            initial={{
              opacity: 0,
              top: activeRect.top,
              left: activeRect.left,
              width: activeRect.width,
              height: activeRect.height,
            }}
            animate={{
              opacity: 1,
              top: activeRect.top,
              left: activeRect.left,
              width: activeRect.width,
              height: activeRect.height,
            }}
            exit={{ opacity: 0, transition: { duration: 0.06 } }}
            transition={{ ...springs.fast, opacity: { duration: 0.08 } }}
          />
        )}
      </AnimatePresence>
      <ul className="relative">
        {variants.map((variant, idx) => (
          <VariantRow
            key={variant.id}
            variant={variant}
            index={idx}
            isSelected={variant.id === selectedId}
            isEditing={variant.id === editingId}
            ready={readyIds.has(variant.id)}
            registerItem={registerItem}
            onSelect={onSelect}
            onStartRename={onStartRename}
            onCommitRename={onCommitRename}
            onCancelRename={onCancelRename}
            onCopyDescription={onCopyDescription}
            onRemove={onRemove}
          />
        ))}
      </ul>
    </div>
  );
};

const FOLDER_EASE = [0.33, 1, 0.68, 1] as const;
const FOLDER_MOTION_DURATION = 0.22;

/**
 * Folder icon colours, assigned round-robin in source order so each group
 * reads as distinct at a glance. Rivet's own orange (the Install CTA's
 * gradient start) and the violet already in RUN_LABEL_COLORS, so the panel
 * stays inside the palette it already uses.
 */
const FOLDER_COLORS = ['#63729d', '#9aa6c6'] as const;

/**
 * Current Rivet folder treatment: a borderless tinted surface, a coloured
 * folder icon, sentence-case label, and indented direction rows.
 */
const DirectionFolder = ({
  label,
  directionCount,
  color,
  children,
}: {
  label: string;
  directionCount: number;
  color: string;
  children: ReactNode;
}) => {
  // Every folder starts open and stays where the reader put it. Driving this
  // from the selection meant a folder swung shut and another swung open on
  // every scroll step, so the list under the pointer kept moving — the whole
  // panel animated when only the preview was supposed to change.
  const [collapsed, setCollapsed] = useState(false);
  const reduceMotion = useReducedMotion();

  return (
    // No overflow-hidden here: this element is rounded, so it was clipping the
    // selected row's ring at its own corner radius — visible as a shaved
    // corner on whichever row sat flush against the folder's bottom edge. The
    // height animation below has its own overflow-hidden, which is the only
    // place it is actually needed.
    <li className="rounded-lg bg-white/[0.012]">
      <button
        type="button"
        onClick={() => setCollapsed((value) => !value)}
        aria-expanded={!collapsed}
        aria-label={`${collapsed ? 'Expand' : 'Collapse'} ${label} directions`}
        className="flex w-full items-center gap-2 px-3 py-2 text-left transition-colors hover:bg-white/[0.03] focus:outline-none focus-visible:ring-1 focus-visible:ring-inset focus-visible:ring-content-muted/40"
      >
        {collapsed ? (
          <FolderSimple
            size={13}
            weight="fill"
            className="shrink-0"
            style={{ color }}
          />
        ) : (
          <FolderOpen
            size={13}
            weight="fill"
            className="shrink-0"
            style={{ color }}
          />
        )}
        <span className="min-w-0 flex-1 truncate text-sm font-medium text-content">
          {label}
        </span>
        <span className="sr-only">{directionCount} directions</span>
      </button>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key="body"
            initial={reduceMotion ? false : { height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={
              reduceMotion
                ? { duration: 0 }
                : {
                    duration: FOLDER_MOTION_DURATION,
                    ease: FOLDER_EASE,
                  }
            }
            className="overflow-hidden pb-1"
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </li>
  );
};

// --- Panel ----------------------------------------------------------------
type DirectionsPanelProps = {
  ctrl: VariantsDemoController;
  /**
   * Desktop mode: the panel fills an absolutely-positioned slide wrapper (the
   * showcase owns its width + open/close), gets the core shell chrome
   * (shadow, resize handle, close button) and drops the mobile stack styles.
   */
  desktop?: boolean;
  /** Collapse the panel (header close chip). Rendered only when provided. */
  onClose?: () => void;
  /** Begin a drag-resize from the right-edge handle. */
  onResizeStart?: (e: ReactPointerEvent) => void;
  /** Reset to the default width (double-click on the handle). */
  onResizeReset?: () => void;
  /** True while a drag-resize is in flight (keeps the handle highlighted). */
  resizing?: boolean;
};

const DirectionsPanel = ({
  ctrl,
  desktop = false,
  onClose,
  onResizeStart,
  onResizeReset,
  resizing = false,
}: DirectionsPanelProps) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ctrl.variants;
    return ctrl.variants.filter(
      (v) =>
        v.label.toLowerCase().includes(q) ||
        v.brief.toLowerCase().includes(q) ||
        (v.folder ?? v.tag).toLowerCase().includes(q),
    );
  }, [search, ctrl.variants]);

  const folders = useMemo(() => {
    const groups = new Map<string, DemoVariant[]>();
    for (const variant of filtered) {
      const label = variant.folder ?? variant.tag;
      const group = groups.get(label);
      if (group) group.push(variant);
      else groups.set(label, [variant]);
    }
    return [...groups.entries()].map(([label, variants]) => ({
      label,
      variants,
    }));
  }, [filtered]);

  return (
    <aside
      className={cn(
        'rivet-variants flex shrink-0 flex-col overflow-hidden bg-[var(--main)] font-main text-content',
        desktop
          ? // Core shell (ElementInspector): fills the slide wrapper, elevated
            // over the preview. With a resize handle its hairline draws the
            // right edge; without one, fall back to a plain border.
            cn(
              'relative h-full w-full shadow-2xl',
              !onResizeStart && 'border-r border-[var(--main-border)]',
            )
          : 'h-[42%] w-full border-t border-[var(--main-border)]',
      )}
    >
      {/* Header — port of core's GitHome bar: title + close chip. */}
      <div className="z-10 flex shrink-0 items-center justify-between gap-2 border-b border-[var(--main-border)] bg-[var(--main-light)] px-2.5 py-2.5">
        <span
          className="min-w-0 truncate text-sm font-medium text-content"
          title="Directions"
        >
          Directions
        </span>
        {onClose && (
          <button
            type="button"
            aria-label="Close panel"
            title="Close panel"
            onClick={onClose}
            className="flex h-6 w-6 shrink-0 cursor-pointer items-center justify-center rounded p-1 text-content-muted transition-colors hover:bg-[var(--main-input)] hover:text-content focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40"
          >
            <SidebarSimple size={16} weight="bold" />
          </button>
        )}
      </div>

      {/* Search */}
      <div className="px-3 pb-1 pt-2">
        <div className="relative">
          <MagnifyingGlass
            size={13}
            className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 text-content-muted"
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search directions…"
            aria-label="Search directions"
            className="w-full rounded-md border border-[var(--main-border)] bg-[#2e2e2e]/40 py-1.5 pl-7 pr-2 text-xs text-content placeholder:text-content-muted focus:outline-none focus:ring-1 focus:ring-content-muted/40"
          />
        </div>
      </div>

      {/* Variant table — scrolls without rendering a scrollbar, matching the
          core shell's scrollbar-hide. */}
      {/* overflow-hidden, not auto: the list always fits, so a scroll container
          here only ever swallowed the page's wheel events. With no scrollable
          box the wheel passes straight through to the page. */}
      <div className="flex-1 overflow-hidden px-3 py-2">
        {folders.length > 0 ? (
          <ul className="flex flex-col gap-2">
            {folders.map((folder, folderIndex) => (
              <DirectionFolder
                key={folder.label}
                label={folder.label}
                directionCount={folder.variants.length}
                color={FOLDER_COLORS[folderIndex % FOLDER_COLORS.length]}
              >
                <VariantTable
                  variants={folder.variants}
                  selectedId={ctrl.selectedId}
                  editingId={ctrl.editingId}
                  readyIds={ctrl.readyIds}
                  onSelect={ctrl.select}
                  onStartRename={ctrl.startRename}
                  onCommitRename={ctrl.commitRename}
                  onCancelRename={ctrl.cancelRename}
                  onCopyDescription={ctrl.copyDescription}
                  onRemove={ctrl.remove}
                />
              </DirectionFolder>
            ))}
          </ul>
        ) : (
          <p className="px-3 py-6 text-center text-xs text-content-muted">
            No variants match “{search}”.
          </p>
        )}
      </div>

      {/* Footer — port of the core Footer (AgentVariantsPanel.tsx): the
          selected direction's title on the left, and the Share split button on
          the right. Core dropped "Clear all" and the always-on "Send to …"
          button, so the demo does too. The split button mirrors core's
          SplitButton primary + caret segments (inert in the demo). */}
      <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--main-border)] bg-[var(--main-light)] px-3 pb-4 pt-2">
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-content">
            {ctrl.selected.label.trim() || 'Untitled direction'}
          </div>
        </div>
        <div className="flex shrink-0 items-stretch">
          <button
            type="button"
            className="flex h-7 shrink-0 cursor-pointer items-center gap-1.5 rounded-l-md bg-[var(--main-hover)] px-3 text-xs font-medium text-white transition-colors hover:bg-[var(--main-input)]"
          >
            Share
          </button>
          <button
            type="button"
            aria-label="More share actions"
            title="More share actions"
            className="h-7 shrink-0 cursor-pointer rounded-r-md border-l border-white/20 bg-[var(--main-hover)] px-1.5 text-white transition-colors hover:bg-[var(--main-input)]"
          >
            <CaretDown size={14} weight="bold" />
          </button>
        </div>
      </div>

      {/* Resize handle — port of core's right-edge separator: a 12px grab zone
          whose hairline doubles as the panel's right border, thickening on
          hover/drag. Double-click resets to the default width. */}
      {desktop && onResizeStart && (
        <div
          role="separator"
          aria-orientation="vertical"
          aria-label="Resize panel"
          onPointerDown={onResizeStart}
          onDoubleClick={onResizeReset}
          className="group/resize absolute inset-y-0 right-0 z-20 flex w-3 cursor-col-resize touch-none items-center justify-end"
        >
          <span
            className={cn(
              'h-full transition-all duration-150',
              resizing
                ? 'w-0.5 bg-content-muted'
                : 'w-px bg-[#4b5563] group-hover/resize:w-0.5 group-hover/resize:bg-content-muted',
            )}
          />
        </div>
      )}
    </aside>
  );
};

export default DirectionsPanel;
