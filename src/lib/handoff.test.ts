import { BLUR_LEFT_MS, HANDOFF_TIMEOUT_MS, watchHandoff } from './handoff';

const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });

const blur = () => window.dispatchEvent(new Event('blur'));
const refocus = () => window.dispatchEvent(new Event('focus'));
const hide = () => {
  setVisibility('hidden');
  document.dispatchEvent(new Event('visibilitychange'));
};
const pageHide = () => window.dispatchEvent(new Event('pagehide'));
const wait = (ms: number) => jest.advanceTimersByTime(ms);

let onResult: jest.Mock;

beforeEach(() => {
  jest.useFakeTimers();
  onResult = jest.fn();
});

afterEach(() => {
  jest.useRealTimers();
  setVisibility('visible');
});

describe('watchHandoff', () => {
  it('needs two seconds of focus to stay and a second and a half without it to leave', () => {
    expect(HANDOFF_TIMEOUT_MS).toBe(2000);
    expect(BLUR_LEFT_MS).toBe(1500);
  });

  it.each([
    ['the page hiding', hide],
    ['a pagehide', pageHide],
  ])('reports leaving the page at once for %s', (_, leave) => {
    watchHandoff(onResult);
    leave();
    expect(onResult.mock.calls).toEqual([[true]]);
  });

  it.each([
    ['the page hiding', hide],
    ['a pagehide', pageHide],
  ])('reports leaving the page for a blur followed by %s', (_, leave) => {
    watchHandoff(onResult);
    wait(HANDOFF_TIMEOUT_MS - 1);
    blur();
    wait(BLUR_LEFT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    leave();
    refocus();
    expect(onResult.mock.calls).toEqual([[true]]);
  });

  it('reports leaving once the page goes without focus long enough', () => {
    watchHandoff(onResult);
    blur();
    wait(BLUR_LEFT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    wait(1);
    expect(onResult.mock.calls).toEqual([[true]]);
    refocus();
    wait(HANDOFF_TIMEOUT_MS);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('reports leaving when the visitor comes back from the app', () => {
    watchHandoff(onResult);
    blur();
    wait(7200);
    refocus();
    expect(onResult.mock.calls).toEqual([[true]]);
  });

  it('reports staying when a quick refocus then keeps focus, as after a cancelled browser prompt', () => {
    watchHandoff(onResult);
    blur();
    wait(BLUR_LEFT_MS - 100);
    refocus();
    wait(HANDOFF_TIMEOUT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    wait(1);
    expect(onResult.mock.calls).toEqual([[false]]);
  });

  it('reports leaving when the page loses focus again right after a refocus, as when an accepted prompt hands off to the app', () => {
    watchHandoff(onResult);
    blur();
    wait(800);
    refocus();
    wait(100);
    blur();
    wait(BLUR_LEFT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    wait(1);
    expect(onResult.mock.calls).toEqual([[true]]);
  });

  it('times each blur on its own', () => {
    watchHandoff(onResult);
    blur();
    wait(BLUR_LEFT_MS - 100);
    refocus();
    wait(100);
    blur();
    wait(BLUR_LEFT_MS - 100);
    expect(onResult).not.toHaveBeenCalled();
    refocus();
    wait(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([[false]]);
  });

  it('waits for a late blur that starts inside the window', () => {
    watchHandoff(onResult);
    wait(HANDOFF_TIMEOUT_MS - 1);
    blur();
    wait(BLUR_LEFT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    wait(1);
    expect(onResult.mock.calls).toEqual([[true]]);
  });

  it('ignores a focus event without a prior blur', () => {
    watchHandoff(onResult);
    wait(HANDOFF_TIMEOUT_MS - 500);
    refocus();
    wait(500);
    expect(onResult.mock.calls).toEqual([[false]]);
  });

  it('ignores element focus and blur events that reach the window', () => {
    watchHandoff(onResult);
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.dispatchEvent(new FocusEvent('blur'));
    wait(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([[false]]);
    button.remove();
  });

  it('reports staying once the window passes without losing focus', () => {
    watchHandoff(onResult);
    wait(HANDOFF_TIMEOUT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    wait(1);
    expect(onResult.mock.calls).toEqual([[false]]);
    blur();
    wait(BLUR_LEFT_MS);
    hide();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('ignores a visible visibilitychange', () => {
    watchHandoff(onResult);
    document.dispatchEvent(new Event('visibilitychange'));
    wait(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([[false]]);
  });

  it('drops the result after cancel', () => {
    const cancel = watchHandoff(onResult);
    blur();
    cancel();
    refocus();
    hide();
    wait(BLUR_LEFT_MS + HANDOFF_TIMEOUT_MS);
    expect(onResult).not.toHaveBeenCalled();
  });
});
