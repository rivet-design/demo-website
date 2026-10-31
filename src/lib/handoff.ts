// Detects whether a desktop-app deep link took over. Browsers give no success
// signal for custom schemes, so the page losing focus or visibility right after
// the click stands in for "the app opened". Every platform uses the same check.
//
// A browser's own "open this app?" prompt also takes focus. Accepting it hands
// focus back for a moment before the app takes it, so a refocus only counts
// once the page keeps focus. Cancelling it quickly hands focus straight back;
// anything slower looks the same as visiting the app and returning, and counts
// as leaving.

/** How long the page must keep focus, from the click or a refocus, to count as staying. */
export const HANDOFF_TIMEOUT_MS = 2000;

/** How long the page must stay without focus to count as leaving. */
export const BLUR_LEFT_MS = 1500;

/** Same-tab navigation, so no blank tab is left behind when the app opens. */
export const openDeepLink = (url: string): void => {
  window.location.href = url;
};

/**
 * Calls `onResult` once with whether the visitor left the page. They left if
 * it hides or unloads, or goes `blurMs` without focus. They stayed if it keeps
 * focus for `timeoutMs`, counted from the call or from the latest refocus.
 * Returns a cancel function that drops the pending result.
 */
export const watchHandoff = (
  onResult: (leftPage: boolean) => void,
  timeoutMs = HANDOFF_TIMEOUT_MS,
  blurMs = BLUR_LEFT_MS,
): (() => void) => {
  let done = false;
  let stayTimer: ReturnType<typeof setTimeout> | undefined;
  let leaveTimer: ReturnType<typeof setTimeout> | undefined;

  const awaitStay = () => {
    stayTimer = setTimeout(() => finish(false), timeoutMs);
  };
  const onBlur = (event: Event) => {
    if (event.target !== window || leaveTimer !== undefined) return;
    clearTimeout(stayTimer);
    leaveTimer = setTimeout(() => finish(true), blurMs);
  };
  const onFocus = (event: Event) => {
    if (event.target !== window || leaveTimer === undefined) return;
    clearTimeout(leaveTimer);
    leaveTimer = undefined;
    awaitStay();
  };
  const onPageHide = () => finish(true);
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') finish(true);
  };

  function stop() {
    done = true;
    clearTimeout(stayTimer);
    clearTimeout(leaveTimer);
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
  awaitStay();
  return stop;
};
