// src/timeHelpers.ts

/**
 * Returns a human-friendly remaining time string:
 *  - ≥ 24 h ⇒ “Xd”
 *  - 12–23 h ⇒ “XXh”
 *  -  1–11 h ⇒ “Xh Ym”
 *  -   0–59 m ⇒ “ZZm”
 */
export function formatTimeLeft(endDate: string): string {
  const nowMs = Date.now();
  const endMs = new Date(endDate).getTime();
  const diffMs = Math.max(0, endMs - nowMs);
  const totalMins = Math.ceil(diffMs / 60_000);
  const hours = Math.floor(totalMins / 60);
  const mins = totalMins % 60;

  if (hours >= 24) {
    const days = Math.ceil(hours / 24);
    return `${days}d`;
  } else if (hours >= 12) {
    return `${hours}h`;
  } else if (hours >= 1) {
    return `${hours}h ${mins}m`;
  } else {
    return `${totalMins}m`;
  }
}

/**
 * Picks one of your two CSS time‐pill variants:
 *  - ≤60 m left → “urgent” (red/pink)
 *  -  >60 m   → “neutral” (transparent)
 */
export function getTimeTagClass(endDate: string): "urgent" | "neutral" {
  const now   = Date.now();
  const end   = new Date(endDate).getTime();
  const diffM = Math.max(0, end - now) / 60_000;   // minutes left

  return diffM <= 1_440              // 1 440 min  = 24 h
         ? "urgent"
         : "neutral";
}
