import { useLocalStorage } from './useLocalStorage';

/**
 * Hook to track which advent calendar days have been opened/viewed
 */
export function useOpenedDays() {
  const [openedDays, setOpenedDays] = useLocalStorage<number[]>(
    'nostr:advent:opened-days',
    []
  );

  const markDayAsOpened = (day: number) => {
    setOpenedDays((prev) => {
      if (!prev.includes(day)) {
        return [...prev, day].sort((a, b) => a - b);
      }
      return prev;
    });
  };

  const isDayOpened = (day: number): boolean => {
    return openedDays.includes(day);
  };

  return {
    openedDays,
    markDayAsOpened,
    isDayOpened,
  };
}

