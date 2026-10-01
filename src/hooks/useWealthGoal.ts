import { useCallback, useEffect, useState } from 'react';
import { DATABASE_PATH_CHANGED_EVENT } from '../db';
import { getWealthGoalSetting, setWealthGoal, WEALTH_GOAL_CHANGED_EVENT } from '../db/wealthGoal';
import type { WealthGoal } from '../utils/wealthGoal';

export function useWealthGoal(onError: (message: string) => void) {
  const [goal, setGoal] = useState<WealthGoal | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    let request = 0;
    const reload = () => {
      const id = ++request;
      void getWealthGoalSetting().then((setting) => {
        if (active && id === request) setGoal(setting.goal);
      }).catch((error: unknown) => {
        if (active && id === request) onError(error instanceof Error ? error.message : String(error));
      }).finally(() => {
        if (active && id === request) setLoading(false);
      });
    };
    const changeDatabase = () => {
      setGoal(null);
      setLoading(true);
      reload();
    };
    reload();
    window.addEventListener(WEALTH_GOAL_CHANGED_EVENT, reload);
    window.addEventListener(DATABASE_PATH_CHANGED_EVENT, changeDatabase);
    return () => {
      active = false;
      window.removeEventListener(WEALTH_GOAL_CHANGED_EVENT, reload);
      window.removeEventListener(DATABASE_PATH_CHANGED_EVENT, changeDatabase);
    };
  }, [onError]);
  const save = useCallback(async (next: WealthGoal | null) => {
    await setWealthGoal(next);
    setGoal(next);
  }, []);
  return { goal, loading, save };
}
