import { API_BASE } from "../config";

// Action types your app logs
export type ActionType = "click" | "scroll" | "added_value" | "changed_value" | "removed_value";

// Helper to log user actions to backend
export function logUserAction({
  actionType,
  componentType,
  newValue,
  url,
  asGuestUserId, // Only use this for non-authenticated logging, rare
}: {
  actionType: ActionType,
  componentType?: string | null,
  newValue?: string | null,
  url: string,
  asGuestUserId?: string, // optional, only for guests
}) {
  const token = localStorage.getItem("token");

  // Build log object for POST body
  const log: any = {
    actionType,
    componentType,
    newValue,
    url,
  };

  // Only include userId if explicitly logging as a guest
  if (asGuestUserId) {
    log.userId = asGuestUserId;
  }

  fetch(`${API_BASE}/api/log/log-action`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify(log),
  }).catch(() => {
    //add error tracking
  });
}
