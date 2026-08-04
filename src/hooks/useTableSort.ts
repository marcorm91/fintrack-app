import { useCallback, useState } from 'react';
import type { SortDirection } from '../types';

export type TableSort<Key extends string> = {
  key: Key;
  direction: SortDirection;
};

export function useTableSort<Key extends string>(initialSort: TableSort<Key>) {
  const [sort, setSort] = useState<TableSort<Key>>(initialSort);

  const toggleSort = useCallback((key: Key) => {
    setSort((previous) =>
      previous.key === key
        ? { key, direction: previous.direction === 'asc' ? 'desc' : 'asc' }
        : { key, direction: 'asc' }
    );
  }, []);

  return { sort, toggleSort };
}
