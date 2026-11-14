import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

// All keys live in the single .env at the repo root, shared with the backend.
const envDir = "..";

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, envDir, "");

  // The keys get baked into the extension at build time, so a build without them
  // produces an extension that silently shows a blank page.
  if (command === "build") {
    const missing = ["SUPABASE_URL", "SUPABASE_PUBLISHABLE_KEY"].filter(
      (key) => !env[key],
    );
    if (missing.length) {
      throw new Error(
        `Missing ${missing.join(", ")} in the .env at the repo root. See the README.`,
      );
    }
    if (new URL(env.SUPABASE_URL).pathname !== "/") {
      throw new Error(
        "SUPABASE_URL in .env must be just https://<project>.supabase.co, with nothing after it (no /rest/v1/).",
      );
    }
    if (!env.SUPABASE_PUBLISHABLE_KEY.startsWith("sb_publishable_")) {
      throw new Error(
        "SUPABASE_PUBLISHABLE_KEY in .env must be the publishable key (sb_publishable_...), never the secret one.",
      );
    }
  }

  return {
    plugins: [react(), tsconfigPaths()],
    base: "./", // CRITICAL: This makes paths relative instead of absolute
    envDir,
    // Only these two values reach the extension. SUPABASE_KEY (the secret) never does.
    define: {
      "import.meta.env.VITE_SUPABASE_URL": JSON.stringify(env.SUPABASE_URL ?? ""),
      "import.meta.env.VITE_SUPABASE_ANON_KEY": JSON.stringify(
        env.SUPABASE_PUBLISHABLE_KEY ?? "",
      ),
    },
    build: {
      outDir: "dist",
      rollupOptions: {
        output: {
          entryFileNames: `assets/[name].js`,
          chunkFileNames: `assets/[name].js`,
          assetFileNames: `assets/[name].[ext]`,
        },
      },
    },
  };
});
