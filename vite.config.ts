import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";

export default defineConfig({
  plugins: [react()],
  server: {
    https: false,
    host: true,       //can access from 192.168.1.4:5173
    port: 5173,       //dev server port
    proxy: {
      // Proxy all /api requests to ASP.NET backend
      "/api": {
        target: "http://192.168.1.13:8080",
        secure: false,      // accept self-signed certificate
        changeOrigin: true, // rewrite the Host header to match the target
      },
      // Proxy all /images requests to the same backend
      "/images": {
        target: "http://192.168.1.13:8080",
        secure: false,
        changeOrigin: true,
      },
    },
  },
});
