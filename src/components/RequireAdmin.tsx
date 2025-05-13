// src/components/RequireAdmin.tsx
import React, { JSX } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "../utils/useAuth";

const RequireAdmin: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const { isLoggedIn, isAdmin } = useAuth();
  if (!isLoggedIn) return <Navigate to="/login" replace />;
  if (!isAdmin)    return <Navigate to="/" replace />;
  return children;
};

export default RequireAdmin;
