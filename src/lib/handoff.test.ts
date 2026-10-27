import { HANDOFF_TIMEOUT_MS, watchHandoff } from './handoff';

const setVisibility = (state: DocumentVisibilityState) =>
  Object.defineProperty(document, 'visibilityState', {
    value: state,
    configurable: true,
  });

beforeEach(() => jest.useFakeTimers());

afterEach(() => {
  jest.useRealTimers();
  setVisibility('visible');
});

describe('watchHandoff', () => {
  it('waits about two seconds before giving up', () => {
    expect(HANDOFF_TIMEOUT_MS).toBe(2000);
  });

  it.each([
    ['a window blur', () => window.dispatchEvent(new Event('blur'))],
    [
      'the page hiding',
      () => {
        setVisibility('hidden');
        document.dispatchEvent(new Event('visibilitychange'));
      },
    ],
    ['a pagehide', () => window.dispatchEvent(new Event('pagehide'))],
  ])('reports blurred for %s within the window', (_, leave) => {
    const onResult = jest.fn();
    watchHandoff(onResult);
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS - 1);
    leave();
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([['blurred']]);
  });

  it('reports no_blur once the window passes without losing focus', () => {
    const onResult = jest.fn();
    watchHandoff(onResult);
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS - 1);
    expect(onResult).not.toHaveBeenCalled();
    jest.advanceTimersByTime(1);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
    window.dispatchEvent(new Event('blur'));
    expect(onResult).toHaveBeenCalledTimes(1);
  });

  it('ignores a visible visibilitychange', () => {
    const onResult = jest.fn();
    watchHandoff(onResult);
    document.dispatchEvent(new Event('visibilitychange'));
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult.mock.calls).toEqual([['no_blur']]);
  });

  it('drops the result after cancel', () => {
    const onResult = jest.fn();
    const cancel = watchHandoff(onResult);
    cancel();
    window.dispatchEvent(new Event('blur'));
    jest.advanceTimersByTime(HANDOFF_TIMEOUT_MS);
    expect(onResult).not.toHaveBeenCalled();
  });
});
