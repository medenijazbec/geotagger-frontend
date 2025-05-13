// src/components/RequireAuth.tsx
import React, { JSX } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { isLoggedIn } from "../auth";

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const loc = useLocation();

  if (!isLoggedIn()) {
    /* remember where the user tried to go –
        */
    return <Navigate to="/login" state={{ from: loc }} replace />;
  }
  return children;
};

export default RequireAuth;
