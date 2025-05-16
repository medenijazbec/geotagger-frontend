// src/utils/useAuth.ts
import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";

interface AppClaims {
  sub?: string;
  exp?: number;
  role?: string | string[];
  roles?: string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?: string | string[];
  external?: "0" | "1";
}

export const useAuth = () => {
  const token = localStorage.getItem("token");
  const claims = useMemo<Partial<AppClaims>>(() => {
    if (!token) return {};
    try {
      return jwtDecode<AppClaims>(token);
    } catch {
      return {};
    }
  }, [token]);

  const isLoggedIn =
    !!token && !!claims.sub && (!claims.exp || claims.exp * 1000 > Date.now());

  const rawRoles = [
    claims.role,
    claims.roles,
    claims["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"],
  ]
    .flat()
    .filter(Boolean) as string[];

  const roles = [...new Set(rawRoles)];
  const isAdmin = roles.includes("Admin");
  const isExternal = claims.external === "1";

  return {
    token,
    claims,
    isLoggedIn,
    isAdmin,
    isExternal,
    roles,
  };
};
