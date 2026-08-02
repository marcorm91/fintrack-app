import { useEffect, useRef } from 'react';
import type { Chart } from 'chart.js';

type ChartKinds = 'bar';

export type ChartInstance<TType extends ChartKinds, TData, TLabel> =
  | Chart<TType, TData, TLabel>
  | undefined;

export function useChartResize<
  TType extends ChartKinds = ChartKinds,
  TData = Array<number | null>,
  TLabel = unknown
>() {
  const chartRef = useRef<ChartInstance<TType, TData, TLabel>>();
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || typeof ResizeObserver === 'undefined') {
      return;
    }
    const observer = new ResizeObserver(() => {
      chartRef.current?.resize();
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  return { chartRef, containerRef };
}
