import { useCallback, useEffect, useRef, useState } from 'react';

export type SwipeDirection = 'next' | 'previous';

type UseSwipeNavigationOptions = {
  enabled: boolean;
  blocked?: boolean;
  onSwipe: (direction: SwipeDirection) => void;
  threshold?: number;
  axisRatio?: number;
  animationDuration?: number;
};

const INTERACTIVE_TARGETS = 'button, input, select, textarea, canvas, [role="button"]';

export function useSwipeNavigation({
  enabled,
  blocked = false,
  onSwipe,
  threshold = 70,
  axisRatio = 1.6,
  animationDuration = 180
}: UseSwipeNavigationOptions) {
  const startRef = useRef<{ x: number; y: number } | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const [direction, setDirection] = useState<SwipeDirection | null>(null);

  useEffect(
    () => () => {
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
    },
    []
  );

  const clearStart = useCallback(() => {
    startRef.current = null;
  }, []);

  const onTouchStart = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      if (!enabled || blocked) {
        return;
      }
      const target = event.target as HTMLElement;
      if (target.closest(INTERACTIVE_TARGETS)) {
        return;
      }
      const touch = event.touches[0];
      if (touch) {
        startRef.current = { x: touch.clientX, y: touch.clientY };
      }
    },
    [blocked, enabled]
  );

  const onTouchEnd = useCallback(
    (event: React.TouchEvent<HTMLElement>) => {
      const start = startRef.current;
      const touch = event.changedTouches[0];
      startRef.current = null;
      if (!enabled || blocked || !start || !touch) {
        return;
      }

      const deltaX = touch.clientX - start.x;
      const deltaY = touch.clientY - start.y;
      if (Math.abs(deltaX) <= threshold || Math.abs(deltaX) <= Math.abs(deltaY) * axisRatio) {
        return;
      }

      const nextDirection: SwipeDirection = deltaX < 0 ? 'next' : 'previous';
      setDirection(nextDirection);
      onSwipe(nextDirection);
      if (timeoutRef.current !== null) {
        window.clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = window.setTimeout(() => {
        setDirection(null);
        timeoutRef.current = null;
      }, animationDuration);
    },
    [animationDuration, axisRatio, blocked, enabled, onSwipe, threshold]
  );

  const motionClassName =
    direction === 'next'
      ? '-translate-x-4 opacity-75'
      : direction === 'previous'
        ? 'translate-x-4 opacity-75'
        : 'opacity-100';

  return {
    direction,
    motionClassName,
    swipeHandlers: {
      onTouchStart,
      onTouchEnd,
      onTouchCancel: clearStart
    }
  };
}
