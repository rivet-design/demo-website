// Detects whether a desktop-app deep link took over. Browsers give no success
// signal for custom schemes, so the page losing focus or visibility right after
// the click stands in for "the app opened". Every platform uses the same check.

export type HandoffDetection = 'blurred' | 'no_blur';

export const HANDOFF_TIMEOUT_MS = 2000;

/** Same-tab navigation, so no blank tab is left behind when the app opens. */
export const openDeepLink = (url: string): void => {
  window.location.href = url;
};

/**
 * Calls `onResult` once: `blurred` if the page blurs, hides, or unloads within
 * `timeoutMs`, otherwise `no_blur`. Returns a cancel function that drops the
 * pending result.
 */
export const watchHandoff = (
  onResult: (result: HandoffDetection) => void,
  timeoutMs = HANDOFF_TIMEOUT_MS,
): (() => void) => {
  let done = false;
  const onBlur = () => finish('blurred');
  const onVisibilityChange = () => {
    if (document.visibilityState === 'hidden') finish('blurred');
  };
  const timer = setTimeout(() => finish('no_blur'), timeoutMs);

  function stop() {
    done = true;
    clearTimeout(timer);
    window.removeEventListener('blur', onBlur);
    window.removeEventListener('pagehide', onBlur);
    document.removeEventListener('visibilitychange', onVisibilityChange);
  }

  function finish(result: HandoffDetection) {
    if (done) return;
    stop();
    onResult(result);
  }

  window.addEventListener('blur', onBlur);
  window.addEventListener('pagehide', onBlur);
  document.addEventListener('visibilitychange', onVisibilityChange);
  return stop;
};
