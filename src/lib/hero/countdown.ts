export type CountdownState = "upcoming" | "today" | "hidden";

export interface Countdown {
  state: CountdownState;
  daysRemaining: number;
}

const DAY_MS = 24 * 60 * 60 * 1000;

export function computeCountdown(
  weddingDate: Date | null | undefined,
  now: Date,
): Countdown | null {
  if (!weddingDate) return null;
  const diff = weddingDate.getTime() - now.getTime();
  // After wedding + 24h: hide.
  if (diff < -DAY_MS) {
    return { state: "hidden", daysRemaining: 0 };
  }
  // Within the last 24h before the wedding (or any moment up to +24h after): today.
  if (diff < DAY_MS) {
    return { state: "today", daysRemaining: 0 };
  }
  return {
    state: "upcoming",
    daysRemaining: Math.ceil(diff / DAY_MS),
  };
}
