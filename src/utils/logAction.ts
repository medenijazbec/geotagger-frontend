// src/utils/logAction.ts

export interface LogAction {
  actionType: "click" | "scroll" | "added_value" | "changed_value" | "removed_value";
  componentType?: string | null; // e.g. "button", "input", "dropdown", etc.
  newValue?: string | null;
  url: string;
}

export function logUserAction(action: LogAction) {
  const token = localStorage.getItem("token");
  fetch("/api/log-action", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: JSON.stringify({
      ...action,
      actionTimestamp: new Date().toISOString() // optional, backend can also generate this
    })
  }).catch(() => {}); // fire and forget
}

