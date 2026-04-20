import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
        timeout: 120000,       // 2 min — allows slow Groq completions
        proxyTimeout: 120000,
        configure: (proxy) => {
          proxy.on("error", (err, _req, res) => {
            console.warn("[vite proxy] Backend unreachable:", err.message);
            if (res && !res.headersSent) {
              res.writeHead(502, { "Content-Type": "application/json" });
              res.end(
                JSON.stringify({
                  error:
                    "Backend server is not running. Start it with: npm run dev  (in /server)",
                })
              );
            }
          });
        },
      },
    },
  },
});
