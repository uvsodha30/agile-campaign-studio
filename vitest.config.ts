// Standalone from vite.config.ts on purpose: that file is managed by
// @lovable.dev/vite-tanstack-config and warns against adding plugins
// manually. Test tooling stays fully separate so it can never collide
// with app build config.
import { defineConfig } from "vitest/config";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [tsconfigPaths()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts"],
  },
});
