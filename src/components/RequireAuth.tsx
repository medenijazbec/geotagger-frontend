// src/components/RequireAuth.tsx
import React, { JSX } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';

const RequireAuth: React.FC<{ children: JSX.Element }> = ({ children }) => {
  const loc  = useLocation();
  const nav  = useNavigate();

  /* ───────── 1.  Bootstrap from ?token=… (OAuth redirect) ───────── */
  const params     = new URLSearchParams(loc.search);
  const urlToken   = params.get('token');
  if (urlToken) {
    localStorage.setItem('token', urlToken);

    /* Strip the query-string so it won’t be parsed again */
    params.delete('token');
    params.delete('externalLogin');
    const cleanUrl =
      loc.pathname + (params.toString() ? '?' + params.toString() : '');
    nav(cleanUrl, { replace: true });
  }

  /* ───────── 2.  Normal auth guard ───────── */
  const token = localStorage.getItem('token');
  if (!token) {
    /* remember where the user wanted to go */
    return <Navigate to="/signin" state={{ from: loc }} replace />;
  }

  return children;
};

export default RequireAuth;
