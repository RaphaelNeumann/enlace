import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  test: {
    environment: "happy-dom",
    setupFiles: ["./vitest.setup.ts"],
    globals: true,
    include: ["src/**/*.test.{ts,tsx}", "src/**/__tests__/**/*.{ts,tsx}"],
    exclude: ["node_modules", ".next", "e2e"],
    coverage: {
      provider: "v8",
      reporter: ["text", "html", "json-summary"],
      include: ["src/**/*.{ts,tsx}", "proxy.ts"],
      exclude: [
        "src/**/*.test.{ts,tsx}",
        "src/**/__tests__/**",
        "src/test/**",
        "src/**/*.d.ts",
        "src/app/**/layout.tsx",
        "src/app/globals.css",
        "src/components/ui/**",
        "src/lib/utils.ts",
        "src/lib/db/index.ts",
        "src/lib/db/schema.ts",
        "drizzle/**",
        "next.config.ts",
        // Placeholder files that get rewritten by upcoming features:
        // unexclude as each feature lands and adds tests.
        "src/app/page.tsx",
        "src/app/(admin)/admin/page.tsx",
        "src/app/(admin)/admin/layout.tsx",
        "src/app/api/auth/**",
        "src/lib/auth/**",
        "proxy.ts",
      ],
      thresholds: {
        lines: 90,
        statements: 90,
        functions: 80,
        branches: 75,
      },
    },
    testTimeout: 10_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});
