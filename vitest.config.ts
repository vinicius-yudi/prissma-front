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
    // Convenção: o teste mora em `__tests__/` DENTRO da pasta do que ele
    // testa — `hooks/__tests__/useBudget.test.ts` para `hooks/useBudget.ts`.
    // Perto o bastante para o import ser `../useBudget` e para a falta de um
    // teste saltar aos olhos; separado o bastante para a listagem da pasta de
    // código continuar sendo só código.
    include: ["src/**/__tests__/**/*.test.{ts,tsx}"],
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
        "src/**/__tests__/**",
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
      // A meta de 95% foi atingida; o piso fica logo abaixo do medido para o
      // CI travar a REGRESSÃO sem reprovar um PR por uma linha de diferença
      // de arredondamento.
      //
      // Regra: ao subir a cobertura, rode `bun run test:coverage` e ajuste
      // estes valores para o novo medido. Eles nunca descem.
      //
      // Cobertura por camada ([x] = fechada):
      //   [x] schemas (zod) · shared/utils · services
      //   [x] hooks
      //   [x] shared/components (design system + shell)
      //   [x] pages (obra, projetos, painel, perfil, pessoas, públicas)
      //
      // O que sobra sem cobrir são ramos que o jsdom não alcança: medição do
      // Recharts (o SVG sai vazio sem layout), gestos reais de arraste do
      // @dnd-kit e alguns caminhos barrados antes pela validação nativa do
      // formulário. Estão documentados no teste de cada um.
      // ---------------------------------------------------------------------
      thresholds: {
        global: { statements: 95.5, branches: 89.8, functions: 93.2, lines: 96.5 },
      },
    },
  },
})
