import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { render, type RenderOptions, type RenderResult } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { I18nextProvider } from "react-i18next"
import { MemoryRouter } from "react-router-dom"

import { ThemeProvider } from "@/contexts/ThemeContext"

import { testI18n } from "./i18n"

/**
 * Monta um componente com os provedores que quase toda tela exige: i18n,
 * rota, TanStack Query e tema.
 *
 * O ThemeProvider entra porque `useTheme` lança fora dele e o <ThemeToggle>
 * aparece em todas as telas públicas — sem ele o teste quebraria no mount, não
 * na asserção. É estado de cliente puro, então não traz rede junto.
 *
 * Deliberadamente **sem** AuthProvider: ele dispara `useQuery` do perfil e
 * puxa a rede para dentro de um teste unitário. Quem precisa de `useAuth`
 * mocka `@/contexts/AuthContext` no próprio arquivo de teste, que é o que
 * mantém a unidade isolada.
 */

interface Options extends Omit<RenderOptions, "wrapper"> {
  /** Rota inicial do MemoryRouter. */
  route?: string
}

function createTestQueryClient(): QueryClient {
  return new QueryClient({
    defaultOptions: {
      // Sem isto um teste de erro espera os 3 retries padrão e estoura o
      // timeout em vez de falhar com a mensagem certa.
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  })
}

export function renderWithProviders(ui: ReactElement, { route = "/", ...options }: Options = {}): RenderResult {
  const queryClient = createTestQueryClient()

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={testI18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    )
  }

  return render(ui, { wrapper: Wrapper, ...options })
}

/** Wrapper para `renderHook` de hooks que só precisam de Query + rota. */
export function createHookWrapper(route = "/") {
  const queryClient = createTestQueryClient()

  return function HookWrapper({ children }: { children: ReactNode }) {
    return (
      <I18nextProvider i18n={testI18n}>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <MemoryRouter initialEntries={[route]}>{children}</MemoryRouter>
          </ThemeProvider>
        </QueryClientProvider>
      </I18nextProvider>
    )
  }
}
