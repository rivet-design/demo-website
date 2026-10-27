import {
  BLUR_RETURN_WINDOW_MS,
  HANDOFF_TIMEOUT_MS,
  watchHandoff,
} from './handoff';

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
  it('waits two seconds for a blur and fifteen for a return', () => {
    expect(HANDOFF_TIMEOUT_MS).toBe(2000);
    expect(BLUR_RETURN_WINDOW_MS).toBe(15000);
  });

  it.each([
    ['the page hiding', hide],
    ['a pagehide', pageHide],
  ])('reports blurred at once for %s', (_, leave) => {
    watchHandoff(onResult);
    leave();
    expect(onResult.mock.calls).toEqual([['blurred']]);
  });

  it.each([
    ['the page hiding', hide],
    ['a pagehide', pageHide],
  ])('reports blurred for a blur followed by %s', (_, leave) => {
    watchHandoff(onResult);
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS - 1);
    blur();
    expect(onResult).not.toHaveBeenCalled();
    leave();
    refocus();
    expect(onResult.mock.calls).toEqual([['blurred']]);
  });

  it('treats a blur alone as provisional until the return window passes', () => {
    watchHandoff(onResult);
    blur();
    jest.advanceTimersByTime(BLUR_RETURN_WINDOW_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onResult.mock.calls).toEqual([['blurred']]);
    refocus();
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it.each([
    ['inside the handoff window', 500],
    ['after the handoff window', HANDOFF_TIMEOUT_MS + 5000],
  ])(
    'reports blur_returned when focus comes back %s without hiding',
    (_, delay) => {
      watchHandoff(onResult);
      blur();
      jest.advanceTimersByTime(delay);
      expect(onResult).not.toHaveBeenCalled();
      refocus();
      expect(onResult.mock.calls).toEqual([['blur_returned']]);
    },
  );

  it('ignores a focus event without a prior blur', () => {
    watchHandoff(onResult);
    refocus();
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
  });

  it('ignores element focus and blur events that reach the window', () => {
    watchHandoff(onResult);
    const button = document.createElement('button');
    document.body.appendChild(button);
    button.dispatchEvent(new FocusEvent('blur'));
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
    button.remove();
  });

  it('reports no_blur once the window passes without losing focus', () => {
    watchHandoff(onResult);
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
    blur();
    refocus();
    jest.advanceTimersByTime(BLUR_RETURN_WINDOW_MS);
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('ignores a visible visibilitychange', () => {
    watchHandoff(onResult);
    document.dispatchEvent(new Event('visibilitychange'));
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
  });

  it('drops the result after cancel', () => {
    const cancel = watchHandoff(onResult);
    blur();
    cancel();
    refocus();
    hide();
    jest.advanceTimersByTime(BLUR_RETURN_WINDOW_MS);
    expect(onResult).not.toHaveBeenCalled();
  });
});
