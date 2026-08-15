import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  clean: true,
  banner: {
    js: '"use client";'
  },
  external: ["react", "react-dom", "@zorveus/sdk"],
  outExtension({ format }) {
    return {
      js: format === "cjs" ? ".js" : ".mjs"
    };
  }
});
