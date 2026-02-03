import { useEffect } from 'react';

export function useSafeAreaInsets() {
  useEffect(() => {
    const root = document.documentElement;

    const update = () => {
      const viewport = window.visualViewport;
      if (!viewport) {
        root.style.setProperty('--app-safe-bottom-visual', '0px');
        return;
      }
      const bottomInset = Math.max(0, window.innerHeight - (viewport.height + viewport.offsetTop));
      root.style.setProperty('--app-safe-bottom-visual', `${Math.round(bottomInset)}px`);
    };

    update();
    window.addEventListener('resize', update);
    window.visualViewport?.addEventListener('resize', update);
    window.visualViewport?.addEventListener('scroll', update);

    return () => {
      window.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('resize', update);
      window.visualViewport?.removeEventListener('scroll', update);
    };
  }, []);
}
