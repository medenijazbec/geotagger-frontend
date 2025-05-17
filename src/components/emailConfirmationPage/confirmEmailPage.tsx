// src/pages/ConfirmEmailPage.tsx
import React, { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { API_BASE } from "../../config";

const ConfirmEmailPage: React.FC = () => {
  const loc = useLocation();
  const [error, setError] = useState<string | null>(null);

  /* uid & tok come from the query-string */
  const qs   = new URLSearchParams(loc.search);
  const uid  = qs.get("uid");
  const tok  = qs.get("tok");

  /* kick off the server call exactly once */
  useEffect(() => {
    if (!uid || !tok) { setError("Bad confirmation link."); return; }

    // redirecting the whole window avoids CORS / fetch-redirect headaches
    window.location.href =
      `${API_BASE}/api/Auth/confirm-email?uid=${encodeURIComponent(uid)}&tok=${encodeURIComponent(tok)}`;
  }, [uid, tok]);

  return (
    <div style={{ display:"grid", placeItems:"center", height:"100vh" }}>
      {error ? (
        <p style={{ color:"red", fontSize:"1.1rem" }}>{error}</p>
      ) : (
        <p style={{ fontSize:"1.1rem" }}>Confirming your e-mail…</p>
      )}
    </div>
  );
};

export default ConfirmEmailPage;
