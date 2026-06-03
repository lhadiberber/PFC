import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      "/api": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
        configure(proxy) {
          proxy.on("error", (_error, _request, response) => {
            if (response.headersSent) {
              return;
            }

            response.writeHead(502, {
              "Content-Type": "application/json",
            });
            response.end(
              JSON.stringify({
                success: false,
                message: "Backend indisponible. Lancez le serveur backend sur le port 5000.",
              })
            );
          });
        },
      },
      "/uploads": {
        target: "http://127.0.0.1:5000",
        changeOrigin: true,
      },
    },
  },
});
