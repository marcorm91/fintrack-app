import type { ToastTone } from '../types';

const TONE_STYLES: Record<ToastTone, string> = {
  danger: 'border-red-200 bg-red-50 text-red-700'
};

export function Toast({ message, tone }: { message: string; tone: ToastTone }) {
  return (
    <div
      className={`fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-2xl border px-6 py-4 text-base font-semibold shadow-lg ${TONE_STYLES[tone]}`}
    >
      {message}
    </div>
  );
}
