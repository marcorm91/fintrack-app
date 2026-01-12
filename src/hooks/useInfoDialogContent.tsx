import { useMemo } from 'react';
import type { ReactNode } from 'react';

type InfoDialog = {
  title: string;
  lines: string[];
  examples: string[];
} | null;

export function useInfoDialogContent(infoDialog: InfoDialog) {
  return useMemo<ReactNode | null>(() => {
    if (!infoDialog) {
      return null;
    }
    return (
      <div className="space-y-2">
        {infoDialog.lines.map((line, index) => (
          <p key={`${infoDialog.title}-line-${index}`}>{line}</p>
        ))}
        {infoDialog.examples.map((example, index) => (
          <div
            key={`${infoDialog.title}-example-${index}`}
            className="rounded-lg bg-ink/5 px-3 py-2 text-xs text-ink"
          >
            {example}
          </div>
        ))}
      </div>
    );
  }, [infoDialog]);
}
