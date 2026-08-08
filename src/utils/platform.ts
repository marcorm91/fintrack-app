export function isMobilePlatform() {
  if (typeof navigator === 'undefined') {
    return false;
  }
  const userAgent = navigator.userAgent || navigator.vendor || '';
  return /android|iphone|ipad|ipod/i.test(userAgent);
}
