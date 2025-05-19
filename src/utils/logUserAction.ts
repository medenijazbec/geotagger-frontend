// src/utils/logUserAction.ts
import { API_BASE } from "../config";

export type ActionType =
  | "click"
  | "scroll"
  | "added_value"
  | "changed_value"
  | "removed_value";

/* ------------------------------------------------------------------ */
/*  SCROLL THROTTLE                                                   */
/* ------------------------------------------------------------------ */
let lastScrollLogTime = 0;
const SCROLL_THROTTLE_MS = 1_500;               // 1.5 s

/* ------------------------------------------------------------------ */
/*  MAIN HELPER                                                       */
/* ------------------------------------------------------------------ */
export function logUserAction(opts: {
  actionType: ActionType;
  componentType?: string | null;
  newValue?: string | null;
  url: string;
  guestId?: string;                             // **only** for NON-logged-in users
}) {
  const { actionType, componentType, newValue, url, guestId } = opts;

  /* throttle scroll events */
  if (actionType === "scroll") {
    const now = Date.now();
    if (now - lastScrollLogTime < SCROLL_THROTTLE_MS) return;
    lastScrollLogTime = now;
  }

  const token = localStorage.getItem("token");

  const payload: Record<string, unknown> = {
    actionType,
    componentType,
    newValue,
    url,
  };

  /* attach userId ONLY for guests (back-end will take JWT for members) */
  if (!token && guestId) {
    payload.userId = guestId;
  }

  fetch(`${API_BASE}/api/log/log-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(payload),
  }).catch(() => {
    /* fire-and-forget – swallow network errors */
  });
}
