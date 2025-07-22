import { defineConfig } from "tsup";

export default defineConfig([
  // ESM build
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    outDir: "dist/esm",
    clean: true,
    sourcemap: true,
    dts: false,
    external: [
      "react",
      "react-dom",
      "@salina-app/pdf-viewer-core",
      "@salina-app/pdf-viewer-core/styles",
    ],
    target: "es2020",
  },
  // CJS build
  {
    entry: ["src/index.ts"],
    format: ["cjs"],
    outDir: "dist/cjs",
    clean: false,
    sourcemap: true,
    dts: false,
    external: [
      "react",
      "react-dom",
      "@salina-app/pdf-viewer-core",
      "@salina-app/pdf-viewer-core/styles",
    ],
    target: "es2020",
  },
  // Types
  {
    entry: ["src/index.ts"],
    format: ["esm"],
    outDir: "dist/types",
    dts: { only: true },
    clean: false,
  },
]);
