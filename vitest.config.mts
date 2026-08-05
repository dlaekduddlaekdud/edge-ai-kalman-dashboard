import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // tsconfig.json의 paths와 동일하게 맞춤.
      // Vitest는 tsconfig를 읽지 않으므로 여기에 다시 선언해야 한다.
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
});