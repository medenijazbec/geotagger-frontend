// src/pages/ConfirmEmailPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../../config";

/**
 * When the user clicks the link they received via e-mail, the URL looks like
 *     /confirm-email?uid=…&tok=…
 *
 * This page simply forwards the browser to the backend endpoint
 *      GET  /api/Auth/confirm-email
 * which (1) confirms the e-mail, (2) issues a fresh JWT and (3) sends back a
 * 302 redirect to  <frontend>/home?token=...
 *
 * Because the whole window is redirected, we avoid any CORS / fetch-redirect
 * complications and we reuse the “?token=” bootstrap logic that already exists
 * inside `RequireAuth.tsx`.
 */
const ConfirmEmailPage: React.FC = () => {
  const loc = useLocation();
  const [error, setError] = useState<string | null>(null);

  // pull uid & tok from the current query-string
  const qs  = new URLSearchParams(loc.search);
  const uid = qs.get("uid");
  const tok = qs.get("tok");

  useEffect(() => {
    if (!uid || !tok) {
      setError("Invalid confirmation link.");
      return;
    }

    // full-page redirect → backend → 302 back with ?token=
    window.location.href =
      `${API_BASE}/api/Auth/confirm-email` +
      `?uid=${encodeURIComponent(uid)}&tok=${encodeURIComponent(tok)}`;
  }, [uid, tok]);

  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      {error
        ? <p style={{ color: "red", fontSize: "1.1rem" }}>{error}</p>
        : <p style={{ fontSize: "1.1rem" }}>Confirming your e-mail…</p>}
    </div>
  );
};

export default ConfirmEmailPage;
