import path from "node:path"
import react from "@vitejs/plugin-react"
import { defineConfig } from "vitest/config"

/**
 * Config de teste separada do `vite.config.ts` de propósito.
 *
 * O config de build carrega o plugin do Tailwind e a ponte do es-toolkit, que
 * não têm papel nenhum em teste unitário e só custam tempo de startup. Aqui
 * fica o mínimo: React (para o JSX) e os mesmos aliases, que precisam ser
 * repetidos porque o Vitest não herda o outro arquivo.
 */

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "#": path.resolve(__dirname, "./src"),
      "@styles": path.resolve(__dirname, "./src/styles"),
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./src/test/setup.ts"],
    include: ["src/**/*.test.{ts,tsx}"],
    css: false,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      reporter: ["text-summary", "html", "lcov"],
      reportsDirectory: "./coverage",
      include: ["src/**/*.{ts,tsx}"],
      exclude: [
        "src/test/**",
        "src/main.tsx",
        "src/**/*.test.{ts,tsx}",
        // Só declaração de tipo: sem statement para cobrir, e contá-los como
        // 0% arrastaria a média para baixo sem significar nada.
        "src/**/types.ts",
        "src/**/types/**",
        "src/**/*Interface.ts",
        "src/locales/**",
        "src/styles/**",
      ],
      // ---------------------------------------------------------------------
      // RATCHET. Estes números são o PISO atual, não a meta.
      //
      // O requisito do projeto é 75%, mas a suíte está começando: travar em 75
      // agora deixaria todo PR vermelho antes de existir teste, e o gate viraria
      // algo para desligar em vez de algo para respeitar. Então o CI trava a
      // REGRESSÃO desde já, e o piso sobe junto com a suíte.
      //
      // Regra: ao terminar uma camada, rode `bun run test:coverage` e suba
      // estes valores para o novo medido. Eles nunca descem.
      //
      // Metas por camada, na ordem de ataque:
      //   schemas (zod)        90%   — lógica pura, sem desculpa
      //   shared/utils         90%   — idem
      //   services             85%   — mock do @/lib/api, mecânico
      //   hooks                85%   — renderHook + wrapper
      //   shared/components/ui 80%   — render + variantes
      //   pages                60%   — cauda longa
      //   GLOBAL               75%   ← exigência do projeto
      // ---------------------------------------------------------------------
      thresholds: {
        global: { statements: 15.5, branches: 11, functions: 15.5, lines: 15.9 },
      },
    },
  },
})
