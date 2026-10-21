import {
  createContext,
  useContext,
  useEffect,
  useRef,
  type ButtonHTMLAttributes,
  type ReactNode,
} from 'react';
import {
  useFluidHover,
  useRegisterFluidHoverItem,
} from '@/hooks/use-fluid-hover';
import { cn } from '@/lib/utils';
import { FluidHoverHighlight } from './fluid-hover-highlight';

export type MenuInputMode = 'pointer' | 'keyboard';

type GroupProps = {
  label: string;
  startIndex: number;
  activeIndex: number;
  inputMode: MenuInputMode;
  onHighlight: (index: number, mode: MenuInputMode) => void;
  children: ReactNode;
  className?: string;
};

type GroupContext = {
  registerItem: (index: number, element: HTMLElement | null) => void;
  activeIndex: number | null;
  onFocus: (index: number, mode: MenuInputMode) => void;
};

const GroupContext = createContext<GroupContext | null>(null);

export function FluidMenuGroup({
  label,
  startIndex,
  activeIndex,
  inputMode,
  onHighlight,
  children,
  className,
}: GroupProps) {
  const ref = useRef<HTMLDivElement>(null);
  // Section headings and the divider stay inert; only buttons launch actions.
  const hover = useFluidHover(ref, { gapClick: false });
  const localIndex =
    activeIndex >= startIndex ? activeIndex - startIndex : null;

  useEffect(() => {
    if (inputMode === 'pointer' && hover.activeIndex !== null) {
      onHighlight(startIndex + hover.activeIndex, 'pointer');
    }
  }, [hover.activeIndex, inputMode, onHighlight, startIndex]);

  return (
    <GroupContext.Provider
      value={{
        registerItem: hover.registerItem,
        activeIndex: localIndex,
        onFocus: (index, mode) => onHighlight(startIndex + index, mode),
      }}
    >
      <div
        ref={ref}
        role="group"
        aria-label={label}
        className={cn('relative isolate', className)}
        onPointerEnter={(event) => {
          if (event.pointerType !== 'mouse') return;
          if (inputMode !== 'pointer') onHighlight(activeIndex, 'pointer');
          hover.handlers.onMouseEnter();
          hover.handlers.onMouseMove(event);
        }}
        onPointerMove={(event) => {
          if (event.pointerType !== 'mouse') return;
          if (inputMode !== 'pointer') onHighlight(activeIndex, 'pointer');
          hover.handlers.onMouseMove(event);
        }}
        onPointerLeave={(event) => {
          if (event.pointerType !== 'mouse') return;
          hover.handlers.onMouseLeave();
          if (inputMode === 'pointer') onHighlight(-1, 'pointer');
        }}
      >
        <FluidHoverHighlight
          hover={{ ...hover, activeIndex: localIndex }}
          className="z-0 rounded-lg bg-black/[0.05]"
          transition={inputMode === 'keyboard' ? false : undefined}
        />
        <p className="relative z-10 px-3 pb-1 pt-2 font-main text-xs font-normal text-[#646464]">
          {label}
        </p>
        {children}
      </div>
    </GroupContext.Provider>
  );
}

export function FluidMenuItem({
  index,
  className,
  onFocus,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { index: number }) {
  const group = useContext(GroupContext);
  if (!group) throw new Error('FluidMenuItem requires a FluidMenuGroup');
  const ref = useRef<HTMLButtonElement>(null);
  useRegisterFluidHoverItem(group.registerItem, index, ref);

  return (
    <button
      {...props}
      ref={ref}
      type="button"
      data-highlighted={group.activeIndex === index ? '' : undefined}
      onFocus={(event) => {
        // Native focus visibility distinguishes keyboard focus from a click.
        group.onFocus(
          index,
          event.currentTarget.matches(':focus-visible')
            ? 'keyboard'
            : 'pointer',
        );
        onFocus?.(event);
      }}
      className={cn(
        'relative z-10 flex w-full items-center gap-3 rounded-lg px-3 py-3 text-left font-main text-sm text-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-black/30',
        className,
      )}
    />
  );
}
