// src/utils/useAuth.ts
import { useMemo } from "react";
import { jwtDecode } from "jwt-decode";

interface Decoded {
  sub?: string;
  role?: string | string[];
  roles?: string[];
  "http://schemas.microsoft.com/ws/2008/06/identity/claims/role"?:
    | string
    | string[];
  [key: string]: any;
}

/*export function useAuth() {
  const token = localStorage.getItem("token");
  const decoded: Decoded = useMemo(() => {
    if (!token) return {};
    try {
      return jwtDecode<Decoded>(token);
    } catch {
      return {};
    }
  }, [token]);

  const isLoggedIn = Boolean(decoded.sub);

  const roles = [
    decoded.role,
    ...(decoded.roles || []),
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"]
  ]
  .flat()
  .filter(Boolean) as string[];

  const isAdmin = roles.includes("Admin");

  console.log("Roles from token:", roles);

  return { isLoggedIn, roles, isAdmin };
}
*/ 


export function useAuth() {
  const token = localStorage.getItem("token");
  const decoded: Decoded = useMemo(() => {
    if (!token) return {};
    try {
      const decodedToken = jwtDecode<Decoded>(token);
      console.log(decodedToken); // Important debugging step
      return decodedToken;
    } catch (e) {
      console.error(e);
      return {};
    }
  }, [token]);
  



  
  const isLoggedIn = Boolean(decoded.sub);

  // collect all possible role fields into a single array:
  const raw =
    decoded.role ??
    decoded.roles ??
    decoded["http://schemas.microsoft.com/ws/2008/06/identity/claims/role"];
  const roles = Array.isArray(raw) ? raw : raw ? [raw] : [];

  const isAdmin = roles.includes("Admin");

  return { isLoggedIn, roles, isAdmin };
}
