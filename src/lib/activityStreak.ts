const DAY_MS = 24 * 60 * 60 * 1000;

function utcDay(value: Date | string | number): number | null {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate());
}

export function calculateActivityStreak(
  activityDates: Array<Date | string | number>,
  now: Date = new Date(),
): { currentStreak: number; lastActivityDate: string | null } {
  const today = utcDay(now);
  if (today === null) return { currentStreak: 0, lastActivityDate: null };

  const days = [...new Set(
    activityDates
      .map(utcDay)
      .filter((day): day is number => day !== null && day <= today),
  )].sort((left, right) => right - left);

  if (days.length === 0) return { currentStreak: 0, lastActivityDate: null };
  const latestDay = days[0];
  const lastActivityDate = new Date(latestDay).toISOString().slice(0, 10);
  if (today - latestDay > DAY_MS) {
    return { currentStreak: 0, lastActivityDate };
  }

  let currentStreak = 1;
  for (let index = 1; index < days.length; index += 1) {
    if (days[index - 1] - days[index] !== DAY_MS) break;
    currentStreak += 1;
  }
  return { currentStreak, lastActivityDate };
}
