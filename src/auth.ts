// src/auth.ts
export const getToken = () => localStorage.getItem('token');
export const isLoggedIn = () => Boolean(getToken());
