import js from '@eslint/js'
import globals from 'globals'
import reactHooks from 'eslint-plugin-react-hooks'
import reactRefresh from 'eslint-plugin-react-refresh'
import tseslint from 'typescript-eslint'
import { defineConfig, globalIgnores } from 'eslint/config'

// Arquivos com `setState` dentro de `useEffect` que existem desde antes da
// regra. Ver DÍVIDA no fim do arquivo.
const LEGACY_SET_STATE_IN_EFFECT = [
  'src/pages/obra-selecionada/components/StageFormModal.tsx',
  'src/pages/obra-selecionada/components/TaskFormModal.tsx',
  'src/pages/perfil/hooks/usePerfilForm.ts',
  'src/pages/projetos/hooks/useCepLookup.ts',
]

export default defineConfig([
  globalIgnores(['dist', 'coverage']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      js.configs.recommended,
      tseslint.configs.recommended,
      reactHooks.configs.flat.recommended,
      reactRefresh.configs.vite,
    ],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    rules: {
      // `const { confirmPassword, ...rest } = data` é como o repositório omite
      // um campo antes de mandar ao back-end. O nome descartado é intencional,
      // e sinalizá-lo empurraria para o `delete`, que é pior.
      '@typescript-eslint/no-unused-vars': [
        'error',
        { ignoreRestSiblings: true, argsIgnorePattern: '^_' },
      ],
    },
  },
  {
    // Contextos e o PageChrome exportam o provider junto do hook que o lê —
    // separar em dois arquivos só para o Fast Refresh deixaria a API do
    // contexto espalhada. A regra continua ativa para qualquer OUTRO export
    // não-componente nesses arquivos; só estes três nomes passam.
    files: ['src/contexts/**/*.tsx', 'src/shared/components/ui/page-chrome/PageChrome.tsx'],
    rules: {
      'react-refresh/only-export-components': [
        'warn',
        { allowExportNames: ['useAuth', 'useTheme', 'useOncePerPage'] },
      ],
    },
  },
  {
    // Testes e utilitários de teste.
    //
    // `only-export-components` é a regra do Fast Refresh: ela existe para o
    // HMR do navegador e não se aplica a arquivo que o Vitest importa. Sem
    // esta exceção, `renderWithProviders.tsx` (que exporta funções, não
    // componentes) apareceria como erro.
    files: ['**/*.test.{ts,tsx}', 'src/test/**/*.{ts,tsx}'],
    rules: {
      'react-refresh/only-export-components': 'off',
    },
  },
  {
    // ------------------------------------------------------------------
    // DÍVIDA — não estenda esta lista.
    //
    // `setState` dentro de `useEffect` dispara render em cascata. Estes
    // quatro arquivos são anteriores à regra e o conserto certo (remontar
    // via `key` no pai, CLAUDE.md §4) mexe em modais que ainda não têm
    // teste — então virou `warn` aqui, em vez de ficar bloqueando o CI ou,
    // pior, virar motivo para desligar a regra no repositório inteiro.
    //
    // Ao escrever teste para um destes, faça o refactor e tire o arquivo
    // da lista. Quando a lista esvaziar, apague este bloco.
    // ------------------------------------------------------------------
    files: LEGACY_SET_STATE_IN_EFFECT,
    rules: {
      'react-hooks/set-state-in-effect': 'warn',
    },
  },
])
