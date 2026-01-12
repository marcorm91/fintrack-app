import { useState } from 'react';
import { getMonthValue, getYearValue } from '../utils/date';

export function usePeriodSelection() {
  const [monthValue, setMonthValue] = useState(() => getMonthValue(new Date()));
  const [yearValue, setYearValue] = useState(() => getYearValue(new Date()));
  const currentMonthValue = getMonthValue(new Date());
  const currentYearValue = getYearValue(new Date());
  const isCurrentMonth = monthValue === currentMonthValue;
  const isCurrentYear = yearValue === currentYearValue;

  return {
    monthValue,
    setMonthValue,
    yearValue,
    setYearValue,
    currentMonthValue,
    currentYearValue,
    isCurrentMonth,
    isCurrentYear
  };
}
