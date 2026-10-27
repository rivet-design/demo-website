// Detects whether a desktop-app deep link took over. Browsers give no success
// signal for custom schemes, so the page losing focus or visibility right after
// the click stands in for "the app opened". Every platform uses the same check.
//
// A blur alone is provisional: a browser's own "open this app?" prompt also
// takes focus, and cancelling or dismissing it hands focus straight back while
// the page stays visible.

export type HandoffDetection = 'blurred' | 'blur_returned' | 'no_blur';

export const HANDOFF_TIMEOUT_MS = 2000;

/** How long after a blur a refocus still counts as the handoff failing. */
export const BLUR_RETURN_WINDOW_MS = 15000;

/** Same-tab navigation, so no blank tab is left behind when the app opens. */
export const openDeepLink = (url: string): void => {
  window.location.href = url;
};

/**
 * Calls `onResult` once:
 * - `no_blur` if the page keeps focus for `timeoutMs`;
 * - `blur_returned` if it blurs within `timeoutMs` and regains focus within
 *   `returnWindowMs` of the blur without ever being hidden;
 * - `blurred` if it hides or unloads, or stays blurred past `returnWindowMs`.
 * Returns a cancel function that drops the pending result.
 */
export const watchHandoff = (
  onResult: (result: HandoffDetection) => void,
  timeoutMs = HANDOFF_TIMEOUT_MS,
  returnWindowMs = BLUR_RETURN_WINDOW_MS,
): (() => void) => {
  let done = false;
  let returnTimer: ReturnType<typeof setTimeout> | undefined;

  const onBlur = (event: Event) => {
    if (event.target !== window || returnTimer !== undefined) return;
    returnTimer = setTimeout(() => finish('blurred'), returnWindowMs);
  };
  const onFocus = (event: Event) => {
    if (event.target === window && returnTimer !== undefined) {
      finish('blur_returned');
    }
  };
  const onPageHide = () => finish('blurred');
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') finish('blurred');
  };
  const timer = setTimeout(() => {
    if (returnTimer === undefined) finish('no_blur');
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

  function finish(result: HandoffDetection) {
    if (done) return;
    stop();
    onResult(result);
  }

  window.addEventListener('blur', onBlur);
  window.addEventListener('focus', onFocus);
  window.addEventListener('pagehide', onPageHide);
  document.addEventListener('visibilitychange', onVisibilityChange);
  return stop;
};
