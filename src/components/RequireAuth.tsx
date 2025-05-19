// src/components/RequireAuth.tsx
import React, { JSX, useEffect } from "react";
import { Navigate, useLocation, useNavigate } from "react-router-dom";

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const loc = useLocation();
  const nav = useNavigate();
  const token = localStorage.getItem("token");

  // Handle OAuth redirect with ?token=...
  useEffect(() => {
    const params = new URLSearchParams(loc.search);
    const urlToken = params.get("token");
    if (urlToken) {
      localStorage.setItem("token", urlToken);
      params.delete("token");
      params.delete("externalLogin");
      const cleanUrl =
        loc.pathname + (params.toString() ? "?" + params.toString() : "");
      nav(cleanUrl, { replace: true });
    }
  }, [loc, nav]);

  // Guard
  if (!token) {
    return <Navigate to="/signin" state={{ from: loc }} replace />;
  }

  return children;
};

export default RequireAuth;
