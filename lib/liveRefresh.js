// Browsers throttle setInterval in background tabs, so polling alone isn't
// enough when a user switches between windows. This refreshes immediately
// whenever the tab/window regains focus or becomes visible again.
export function attachLiveRefresh(callback) {
  function onFocus() {
    callback();
  }
  function onVisibility() {
    if (document.visibilityState === "visible") callback();
  }
  window.addEventListener("focus", onFocus);
  document.addEventListener("visibilitychange", onVisibility);
  return () => {
    window.removeEventListener("focus", onFocus);
    document.removeEventListener("visibilitychange", onVisibility);
  };
}
