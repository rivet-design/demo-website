// Detects whether a desktop-app deep link took over. Browsers give no success
// signal for custom schemes, so the page losing focus or visibility right after
// the click stands in for "the app opened". Every platform uses the same check.
//
// A blur alone is provisional: a browser's own "open this app?" prompt also
// takes focus, and cancelling or dismissing it hands focus straight back while
// the page stays visible.

export const HANDOFF_TIMEOUT_MS = 2000;

/** How long after a blur a refocus still counts as the handoff failing. */
export const BLUR_RETURN_WINDOW_MS = 15000;

/** Same-tab navigation, so no blank tab is left behind when the app opens. */
export const openDeepLink = (url: string): void => {
  window.location.href = url;
};

/**
 * Calls `onResult` once with whether the visitor left the page. They left if
 * it hides or unloads, or blurs within `timeoutMs` and stays blurred for
 * `returnWindowMs`. They stayed if it keeps focus for `timeoutMs`, or blurs
 * and regains focus within `returnWindowMs` without ever being hidden.
 * Returns a cancel function that drops the pending result.
 */
export const watchHandoff = (
  onResult: (leftPage: boolean) => void,
  timeoutMs = HANDOFF_TIMEOUT_MS,
  returnWindowMs = BLUR_RETURN_WINDOW_MS,
): (() => void) => {
  let done = false;
  let returnTimer: ReturnType<typeof setTimeout> | undefined;

  const onBlur = (event: Event) => {
    if (event.target !== window || returnTimer !== undefined) return;
    returnTimer = setTimeout(() => finish(true), returnWindowMs);
  };
  const onFocus = (event: Event) => {
    if (event.target === window && returnTimer !== undefined) {
      finish(false);
    }
  };
  const onPageHide = () => finish(true);
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') finish(true);
  };
  const timer = setTimeout(() => {
    if (returnTimer === undefined) finish(false);
  }, timeoutMs);

  function stop() {
    done = true;
    clearTimeout(timer);
    clearTimeout(returnTimer);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('focus', onFocus);
    window.removeEventListener('pagehide', onPageHide);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function finish(leftPage: boolean) {
    if (done) return;
    stop();
    onResult(leftPage);
  }

  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);
  return stop;
};
