import { act, useCallback, useState } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import {
  FluidMenuGroup,
  FluidMenuItem,
  type MenuInputMode,
} from './FluidMenuGroup';
import { resolveHighlightTransition } from './fluid-hover-highlight';

(
  globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let root: Root;
let container: HTMLDivElement;
let frames: Map<number, FrameRequestCallback>;
let frameId: number;
const runAction = jest.fn();

function Menu() {
  const [active, setActive] = useState(-1);
  const [mode, setMode] = useState<MenuInputMode>('pointer');
  const onHighlight = useCallback((index: number, input: MenuInputMode) => {
    setActive(index);
    setMode(input);
  }, []);
  return (
    <>
      <FluidMenuGroup
        label="Open in desktop"
        startIndex={0}
        activeIndex={active}
        inputMode={mode}
        onHighlight={onHighlight}
      >
        {['Codex', 'Claude', 'Cursor'].map((name, index) => (
          <FluidMenuItem key={name} index={index} onClick={runAction}>
            {name}
          </FluidMenuItem>
        ))}
      </FluidMenuGroup>
      <FluidMenuGroup
        label="Copy prompt to install"
        startIndex={3}
        activeIndex={active}
        inputMode={mode}
        onHighlight={onHighlight}
      >
        <FluidMenuItem index={0} onClick={runAction}>
          Copy prompt for agent
        </FluidMenuItem>
      </FluidMenuGroup>
    </>
  );
}

const flushFrame = () =>
  act(() => {
    const pending = [...frames.values()];
    frames.clear();
    pending.forEach((callback) => callback(performance.now()));
  });

const pointer = (
  element: Element,
  type: string,
  y: number,
  pointerType = 'mouse',
) => {
  act(() => {
    const event = new MouseEvent(type, {
      clientX: 20,
      clientY: y,
      bubbles: true,
      relatedTarget: document.body,
    });
    Object.defineProperty(event, 'pointerType', { value: pointerType });
    element.dispatchEvent(event);
  });
  flushFrame();
};

const group = (label: string) =>
  container.querySelector<HTMLElement>(`[aria-label="${label}"]`)!;
const activeLabels = () =>
  [...container.querySelectorAll('[data-highlighted]')].map(
    (el) => el.textContent,
  );

const measure = (el: HTMLElement, top: number, scale = 1) => {
  const rows = [...el.querySelectorAll('button')];
  const height = 24 + rows.length * 44;
  Object.defineProperties(el, {
    offsetWidth: { configurable: true, value: 240 },
    offsetHeight: { configurable: true, value: height },
  });
  jest.spyOn(el, 'getBoundingClientRect').mockReturnValue({
    x: 0,
    y: top,
    left: 0,
    top,
    right: 240 * scale,
    bottom: top + height * scale,
    width: 240 * scale,
    height: height * scale,
    toJSON: () => ({}),
  });
  rows.forEach((row, index) =>
    Object.defineProperties(row, {
      offsetParent: { configurable: true, value: el },
      offsetTop: { configurable: true, value: 24 + index * 44 },
      offsetLeft: { configurable: true, value: 0 },
      offsetWidth: { configurable: true, value: 240 },
      offsetHeight: { configurable: true, value: 40 },
    }),
  );
};

beforeEach(() => {
  frames = new Map();
  frameId = 0;
  runAction.mockClear();
  jest.spyOn(window, 'requestAnimationFrame').mockImplementation((callback) => {
    frames.set(++frameId, callback);
    return frameId;
  });
  jest.spyOn(window, 'cancelAnimationFrame').mockImplementation((id) => {
    frames.delete(id);
  });
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => root.render(<Menu />));
  measure(group('Open in desktop'), 0);
  measure(group('Copy prompt to install'), 180);
  flushFrame();
});

afterEach(() => {
  act(() => root.unmount());
  container.remove();
  jest.restoreAllMocks();
});

it('keeps one highlight across rows and chooses the nearest row in gaps', () => {
  const desktop = group('Open in desktop');
  pointer(desktop, 'pointermove', 44);
  const fill = desktop.querySelector('[data-slot="fluid-hover-highlight"]');
  expect(activeLabels()).toEqual(['Codex']);
  expect(fill).not.toBeNull();
  pointer(desktop, 'pointermove', 65);
  expect(activeLabels()).toEqual(['Codex']);
  pointer(desktop, 'pointermove', 134);
  expect(activeLabels()).toEqual(['Cursor']);
  expect(desktop.querySelector('[data-slot="fluid-hover-highlight"]')).toBe(
    fill,
  );
  expect(runAction).not.toHaveBeenCalled();
});

it('starts a separate highlight in the copy section and leaves headings inert', () => {
  const desktop = group('Open in desktop');
  pointer(desktop, 'pointermove', 134);
  pointer(desktop, 'pointerout', 180);
  const copy = group('Copy prompt to install');
  pointer(copy, 'pointermove', 224);
  expect(activeLabels()).toEqual(['Copy prompt for agent']);
  expect(
    copy.querySelector('[data-slot="fluid-hover-highlight"]'),
  ).not.toBeNull();
  act(() => copy.querySelector('p')!.click());
  expect(runAction).not.toHaveBeenCalled();
  act(() => copy.querySelector('button')!.click());
  expect(runAction).toHaveBeenCalledTimes(1);
});

it('resolves the pointer correctly in a scaled and scrolled list', () => {
  const desktop = group('Open in desktop');
  measure(desktop, 100, 0.5);
  desktop.scrollTop = 44;
  pointer(desktop, 'pointermove', 145);
  expect(activeLabels()).toEqual(['Cursor']);
});

it('lets keyboard focus take over without sliding, and ignores touch hover', () => {
  const desktop = group('Open in desktop');
  pointer(desktop, 'pointermove', 44, 'touch');
  expect(activeLabels()).toEqual([]);
  act(() => desktop.querySelectorAll('button')[1].focus());
  expect(activeLabels()).toEqual(['Claude']);
  expect(resolveHighlightTransition(false, false)).toEqual({ duration: 0 });
  pointer(desktop, 'pointerover', 134);
  expect(activeLabels()).toEqual(['Cursor']);
});

it('disables all highlight animation for reduced motion', () => {
  expect(resolveHighlightTransition(undefined, true)).toEqual({ duration: 0 });
  expect(resolveHighlightTransition(undefined, false)).toMatchObject({
    type: 'spring',
    bounce: 0,
  });
});
