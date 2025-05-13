/* src/config.ts
 * Central place for the REST API base-url.
 * Falls back to localhost when VITE_API_BASE_URL is missing.
 */
/* Central place for the REST API */
// src/config.ts
export const API_BASE =
  import.meta.env.VITE_API_BASE_URL || "http://192.168.1.13:8080";
