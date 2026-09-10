import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Route, Routes, useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { AccessDeniedPage } from "@/pages/access-denied"
import { NotFoundPage } from "@/pages/not-found"
import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { ModuleGuard } from "../ModuleGuard"
import { ProtectedRoute } from "../ProtectedRoute"

vi.mock("@/contexts/AuthContext", () => ({ useAuth: vi.fn() }))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))
// A animação Lottie do 404 pede canvas, que o jsdom não tem.
vi.mock("@lottiefiles/dotlottie-react", () => ({
  DotLottieReact: () => <div data-testid="lottie" />,
}))

const { useAuth } = await import("@/contexts/AuthContext")
const { useAccess } = await import("@/shared/hooks/useAccess")
const auth = vi.mocked(useAuth)
const acesso = vi.mocked(useAccess)

interface AcessoOpts {
  ocultos?: AppModule[]
  isLoading?: boolean
}

function mockAcesso({ ocultos = [], isLoading = false }: AcessoOpts = {}) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: null,
    isLoading,
    levelOf: (m) => (ocultos.includes(m) ? "" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: () => false,
  })
}

function UrlSpy() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

beforeEach(() => {
  vi.resetAllMocks()
  mockAcesso()
})

describe("<ProtectedRoute />", () => {
  function render() {
    return renderWithProviders(
      <>
        <Routes>
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<span>área logada</span>} />
          </Route>
          <Route path="/login" element={<span>tela de login</span>} />
        </Routes>
        <UrlSpy />
      </>,
      { route: "/dashboard" },
    )
  }

  it("deixa passar quem tem sessão", () => {
    auth.mockReturnValue({ isAuthenticated: true } as ReturnType<typeof useAuth>)

    render()

    expect(screen.getByText("área logada")).toBeInTheDocument()
  })

  // Redireciona com `replace`: sem isso o botão voltar levaria de volta à rota
  // protegida, que redirecionaria de novo — um laço.
  it("manda para o login quem não tem sessão", () => {
    auth.mockReturnValue({ isAuthenticated: false } as ReturnType<typeof useAuth>)

    render()

    expect(screen.getByText("tela de login")).toBeInTheDocument()
    expect(screen.getByTestId("url")).toHaveTextContent("/login")
  })
})

/**
 * O guard consulta a MESMA matriz que gera a sidebar, então nav e permissão
 * não têm como divergir: a sidebar esconde o que o papel não vê, e o guard
 * cobre o acesso direto por URL.
 */
describe("<ModuleGuard />", () => {
  function render(module: AppModule = "orcamento") {
    return renderWithProviders(
      <ModuleGuard module={module}>
        <span>conteúdo do módulo</span>
      </ModuleGuard>,
    )
  }

  // Negar antes de o papel carregar faria "Acesso negado" piscar para quem tem
  // permissão.
  it("espera o papel carregar antes de decidir", () => {
    mockAcesso({ isLoading: true })

    const { container } = render()

    expect(container.querySelector(".animate-pulse")).toBeInTheDocument()
    expect(screen.queryByText("conteúdo do módulo")).not.toBeInTheDocument()
  })

  it("libera o módulo que o papel alcança", () => {
    render()

    expect(screen.getByText("conteúdo do módulo")).toBeInTheDocument()
  })

  it("nega o módulo que o papel não alcança", () => {
    mockAcesso({ ocultos: ["orcamento"] })

    render()

    expect(screen.queryByText("conteúdo do módulo")).not.toBeInTheDocument()
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })
})

describe("<AccessDeniedPage />", () => {
  // Bloqueio sem motivo é o que faz o usuário achar que o sistema quebrou.
  it("explica por que o acesso foi negado", () => {
    renderWithProviders(<AccessDeniedPage />)

    expect(screen.getByRole("heading")).toBeInTheDocument()
    expect(screen.getByRole("button")).toBeInTheDocument()
  })

  it("oferece uma saída para a lista de obras", async () => {
    renderWithProviders(
      <>
        <AccessDeniedPage />
        <UrlSpy />
        <Routes>
          <Route path="*" element={null} />
        </Routes>
      </>,
    )

    await userEvent.click(screen.getByRole("button"))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras")
  })
})

describe("<NotFoundPage />", () => {
  it("mostra o código e o título do 404", () => {
    renderWithProviders(<NotFoundPage />)

    expect(screen.getByTestId("lottie")).toBeInTheDocument()
    expect(screen.getByRole("heading")).toBeInTheDocument()
  })
})
