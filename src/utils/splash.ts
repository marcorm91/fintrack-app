export function dismissSplash() {
  const splash = document.getElementById('splash');
  if (!splash) {
    return;
  }
  splash.classList.add('fade-out');
  const timeout = window.setTimeout(() => splash.remove(), 200);
  return () => window.clearTimeout(timeout);
}
