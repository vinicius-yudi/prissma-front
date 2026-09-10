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
      // A meta acordada é 95%, mas travar em 95 antes de a suíte existir
      // deixaria todo PR vermelho, e o gate viraria algo para desligar em vez
      // de algo para respeitar. Então o CI trava a REGRESSÃO desde já, e o piso
      // sobe junto com a suíte.
      //
      // Regra: ao terminar uma camada, rode `bun run test:coverage` e suba
      // estes valores para o novo medido. Eles nunca descem.
      //
      // Metas por camada, na ordem de ataque ([x] = feito):
      //   [x] schemas (zod)        90%   — lógica pura, sem desculpa
      //   [x] shared/utils         90%   — idem
      //   [x] services             85%   — mock do @/lib/api, mecânico
      //   [x] hooks                85%   — renderHook + wrapper
      //   [x] shared/components    80%   — design system + shell
      //   [~] pages                60%   — cauda longa
      //       GLOBAL               95%   ← meta acordada
      //
      // O que falta, pelo peso em statements não cobertos:
      //   EtapasTab 101 · EquipesTab 64 · ProjectStepModal 63 · StageFormModal 52
      //   DiarioDaObra 50 · pessoas/index 48 · OrcamentoTab 42 · TaskFormModal 40
      //   visaoGeral 38 · TarefasTab 30 · TarefasLista 29 · ProjectCard 28
      //   EtapaCard 25 · ObraLayout 23 · e a cauda de telas menores.
      // ---------------------------------------------------------------------
      thresholds: {
        global: { statements: 57.6, branches: 41.8, functions: 56.9, lines: 58.1 },
      },
    },
  },
})
