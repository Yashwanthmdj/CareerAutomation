import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";

export default defineConfig({
  plugins: [
    tsconfigPaths(),
    tailwindcss(),
    // TanStack Start SSR + server functions. Uses `src/start.ts` + `src/server.ts`.
    tanstackStart({
      server: { entry: "server" },
    }),
    // Must come after TanStack Start's router/code-splitting plugins.
    react(),
  ],
});
