import {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { cn } from '@/lib/utils';

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type PopoverContextValue = {
  open: boolean;
  setOpen: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLElement | null>;
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
};

export const Popover = ({ children, open: controlledOpen, onOpenChange }: PopoverProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const triggerRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;

  const setOpen = (value: boolean) => {
    if (!isControlled) setInternalOpen(value);
    onOpenChange?.(value);
  };

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <PopoverContext.Provider value={{ open, setOpen, triggerRef }}>
      <div ref={containerRef} className="relative inline-flex">
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
  const { open, setOpen } = usePopover();

  return (
    <button
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

const alignClass: Record<PopoverAlign, string> = {
  start: 'left-0',
  center: 'left-1/2 -translate-x-1/2',
  end: 'right-0',
};

const sideClass: Record<PopoverSide, string> = {
  bottom: 'top-full',
  top: 'bottom-full',
};

export const PopoverContent = ({
  children,
  className,
  align = 'start',
  side = 'bottom',
  sideOffset = 6,
  onKeyDown,
}: PopoverContentProps) => {
  const { open } = usePopover();

  if (!open) return null;

  const offsetStyle =
    side === 'bottom'
      ? { marginTop: sideOffset }
      : { marginBottom: sideOffset };

  return (
    <div
      role="dialog"
      style={offsetStyle}
      onKeyDown={onKeyDown}
      className={cn(
        'absolute z-50 overflow-hidden rounded-lg border border-white/10 bg-[hsl(0_0%_15%)] shadow-xl',
        sideClass[side],
        alignClass[align],
        className,
      )}
    >
      {children}
    </div>
  );
};
