import { useCallback, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  CaretDown,
  Copy,
  MagnifyingGlass,
  PencilSimple,
  Trash,
} from '@phosphor-icons/react';
import { cn } from './cn';
import { springs } from './springs';
import SparkleLoader from './SparkleLoader';
import { runLabelStyle } from './runLabelColor';
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
      <li ref={rowRef} data-proximity-index={index} className="group relative z-10">
        <div
          aria-hidden="true"
          className="flex w-full items-start gap-2 rounded-md px-3 py-2"
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
      <li ref={rowRef} data-proximity-index={index} className="group relative z-10">
        <div className="flex w-full items-start gap-2 rounded-md bg-[var(--main-input)] px-3 py-2">
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
    <li ref={rowRef} data-proximity-index={index} className="group relative z-10">
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
          'flex w-full cursor-pointer items-start gap-2 rounded-md px-3 py-2 text-left transition-colors focus:outline-none focus-visible:ring-1 focus-visible:ring-content-muted/40',
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
              className="min-w-0 flex-1 cursor-text select-text truncate text-sm font-medium text-content"
            >
              {variant.label}
            </span>
          </span>
          <span className="mt-0.5 line-clamp-2 block cursor-text select-text text-xs leading-snug text-content-muted">
            {variant.brief}
          </span>
        </span>
        {/* Right cell: run label, fades out on hover so the action cluster
            can take its place. */}
        <span className="relative ml-1 mt-0.5 flex h-5 shrink-0 items-center justify-end">
          <span
            className="max-w-[8rem] truncate rounded px-1.5 py-0.5 text-[10px] font-medium opacity-100 transition-opacity duration-150 group-hover:opacity-0 group-has-[:focus-visible]:opacity-0"
            style={runLabelStyle(variant.tag)}
          >
            {variant.tag}
          </span>
        </span>
      </div>

      {/* Hover action cluster — siblings of the row so pointer events don't
          trigger select; fades in as the run label fades out. */}
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
      className="relative"
      onMouseEnter={handlers.onMouseEnter}
      onMouseMove={handlers.onMouseMove}
      onMouseLeave={handlers.onMouseLeave}
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

// --- Panel ----------------------------------------------------------------
const DirectionsPanel = ({ ctrl }: { ctrl: VariantsDemoController }) => {
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return ctrl.variants;
    return ctrl.variants.filter(
      (v) =>
        v.label.toLowerCase().includes(q) ||
        v.brief.toLowerCase().includes(q),
    );
  }, [search, ctrl.variants]);

  return (
    <aside
      className="rivet-variants flex h-[42%] w-full shrink-0 flex-col overflow-hidden border-t border-[var(--main-border)] bg-[var(--main)] font-main text-content sm:order-first sm:h-full sm:w-[340px] sm:border-r sm:border-t-0"
    >
      {/* Header */}
      <div className="flex shrink-0 items-center px-3 py-2">
        <span className="truncate text-sm font-medium text-content" title="Directions">
          Directions
        </span>
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

      {/* Variant table */}
      <div className="flex-1 overflow-y-auto overscroll-contain px-3 py-2">
        {filtered.length > 0 ? (
          <VariantTable
            variants={filtered}
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
    </aside>
  );
};

export default DirectionsPanel;
