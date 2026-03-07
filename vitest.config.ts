import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "ai-jue-core": path.resolve(__dirname, "packages/ai-jue-core/src/index.ts"),
    },
  },
  test: {
    include: ["packages/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
    exclude: ["**/node_modules/**", "**/dist/**"],
  },
});
