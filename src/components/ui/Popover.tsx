import {
  createContext,
  useContext,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement>;
  contentRef: React.RefObject<HTMLDivElement>;
};

const PopoverContext = createContext<PopoverContextValue | null>(null);

const usePopover = () => {
  const ctx = useContext(PopoverContext);
  if (!ctx) throw new Error('Popover compound components must be used inside <Popover>');
  return ctx;
};

// ---------------------------------------------------------------------------
// Root
// ---------------------------------------------------------------------------

type PopoverProps = {
  children: ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  className?: string;
};

export const Popover = ({ children, open: controlledOpen, onOpenChange, className }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      // The content is portaled to <body>, so it's outside containerRef — check
      // it explicitly or clicking a menu row would be treated as "outside".
      if (containerRef.current?.contains(target)) return;
      if (contentRef.current?.contains(target)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef, contentRef }}>
      <div ref={containerRef} className={cn('relative inline-flex', className)}>
        {children}
      </div>
    </PopoverContext.Provider>
  );
};

// ---------------------------------------------------------------------------
// Trigger
// ---------------------------------------------------------------------------

type PopoverTriggerProps = {
  children: ReactNode;
  asChild?: boolean;
  className?: string;
  onKeyDown?: React.KeyboardEventHandler<HTMLButtonElement>;
};

export const PopoverTrigger = ({ children, className, onKeyDown }: PopoverTriggerProps) => {
  const { open, setOpen, triggerRef } = usePopover();

  return (
    <button
      ref={triggerRef}
      type="button"
      aria-expanded={open}
      aria-haspopup="true"
      onClick={() => setOpen(!open)}
      onKeyDown={onKeyDown}
      className={className}
    >
      {children}
    </button>
  );
};

// ---------------------------------------------------------------------------
// Content
// ---------------------------------------------------------------------------

type PopoverAlign = 'start' | 'center' | 'end';
type PopoverSide = 'top' | 'bottom';

type PopoverContentProps = {
  children: ReactNode;
  className?: string;
  align?: PopoverAlign;
  side?: PopoverSide;
  sideOffset?: number;
  onKeyDown?: React.KeyboardEventHandler<HTMLDivElement>;
};

export const PopoverContent = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  onKeyDown,
}: PopoverContentProps) => {
  const { open, triggerRef, contentRef } = usePopover();
  // Portaled to <body> with fixed positioning derived from the trigger, so the
  // menu escapes any `z-index` stacking context its container sits in (page
  // sections are lifted to z-10 / the sketch overlay to z-20) and is never
  // clipped or hidden behind them. A high z-index keeps it above everything.
  const [style, setStyle] = useState<CSSProperties | null>(null);

  useLayoutEffect(() => {
    if (!open) {
      setStyle(null);
      return;
    }
    const compute = () => {
      const t = triggerRef.current;
      if (!t) return;
      const r = t.getBoundingClientRect();
      const next: CSSProperties = { position: 'fixed' };
      if (side === 'bottom') next.top = r.bottom + sideOffset;
      else next.bottom = window.innerHeight - r.top + sideOffset;
      if (align === 'start') next.left = r.left;
      else if (align === 'end') next.right = window.innerWidth - r.right;
      else {
        next.left = r.left + r.width / 2;
        next.transform = 'translateX(-50%)';
      }
      setStyle(next);
    };
    compute();
    // Reposition while open so it tracks scroll/resize. Capture phase catches
    // scrolling on any ancestor, not just the window.
    window.addEventListener('scroll', compute, true);
    window.addEventListener('resize', compute);
    return () => {
      window.removeEventListener('scroll', compute, true);
      window.removeEventListener('resize', compute);
    };
  }, [open, align, side, sideOffset, triggerRef]);

  if (!open || !style) return null;

  return createPortal(
    <div
      ref={contentRef}
      role="dialog"
      style={style}
      onKeyDown={onKeyDown}
      className={cn(
        'z-[1000] overflow-hidden rounded-lg border border-white/10 bg-[hsl(0_0%_15%)] shadow-xl',
        className,
      )}
    >
      {children}
    </div>,
    document.body,
  );
};
