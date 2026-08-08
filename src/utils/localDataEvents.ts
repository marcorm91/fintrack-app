export const LOCAL_DATA_CHANGED_EVENT = 'fintrack:local-data-changed';

export function notifyLocalDataChanged() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new Event(LOCAL_DATA_CHANGED_EVENT));
  }
}
