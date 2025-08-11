import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts", "src/react/index.tsx"],
  format: ["cjs", "esm"],
  dts: true,
  outDir: "dist",
  clean: true
});
