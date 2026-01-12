import { useEffect, useRef } from 'react';
import type { Chart, ChartType } from 'chart.js';

type ChartKinds = Extract<ChartType, 'bar' | 'line'>;

export type ChartInstance<TType extends ChartType, TData, TLabel> =
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
