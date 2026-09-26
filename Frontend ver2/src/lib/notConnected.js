// Placeholder for Figma actions that have nothing behind them yet — either the
// backend route doesn't exist or the feature (printing, export) isn't built.
export function notConnected(action, reason) {
  window.alert(`${action} isn't connected yet — ${reason}.`);
}
