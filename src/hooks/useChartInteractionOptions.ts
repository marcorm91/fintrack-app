import { useCallback, useMemo } from 'react';
import type { ActiveElement, ChartEvent, ChartOptions } from 'chart.js';
import type { SeriesKey } from '../types';

type BarChartOptions = ChartOptions<'bar'>;

type UseChartInteractionOptions = {
  options: BarChartOptions;
  series: ReadonlyArray<{ key: SeriesKey }>;
  isMobile: boolean;
  onShowOnly: (key: SeriesKey) => void;
  onOpenModal: () => void;
};

export function useChartInteractionOptions({
  options,
  series,
  isMobile,
  onShowOnly,
  onOpenModal
}: UseChartInteractionOptions) {
  const handleClick = useCallback(
    (_event: ChartEvent, elements: ActiveElement[]) => {
      const element = elements[0];
      if (!element) {
        onOpenModal();
        return;
      }
      const seriesKey = series[element.datasetIndex]?.key;
      if (seriesKey) {
        onShowOnly(seriesKey);
      }
    },
    [onOpenModal, onShowOnly, series]
  );

  const interactiveOptions = useMemo<BarChartOptions>(
    () => ({ ...options, onClick: handleClick }),
    [handleClick, options]
  );

  const compactOptions = useMemo<BarChartOptions>(() => {
    if (!isMobile) {
      return interactiveOptions;
    }
    return {
      ...interactiveOptions,
      scales: {
        ...interactiveOptions.scales,
        x: {
          ...(interactiveOptions.scales?.x ?? {}),
          ticks: {
            ...((interactiveOptions.scales?.x as { ticks?: object })?.ticks ?? {}),
            autoSkip: true,
            maxTicksLimit: 6
          }
        },
        y: {
          ...(interactiveOptions.scales?.y ?? {}),
          ticks: {
            ...((interactiveOptions.scales?.y as { ticks?: object })?.ticks ?? {}),
            maxTicksLimit: 5
          }
        }
      }
    };
  }, [interactiveOptions, isMobile]);

  return { interactiveOptions, compactOptions };
}
