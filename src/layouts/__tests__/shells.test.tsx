import { screen } from "@testing-library/react"
import { Route, Routes } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { ForgotPasswordPage } from "@/pages/forgot-password"
import { LoginPage } from "@/pages/login"
import { ResetPasswordPage } from "@/pages/reset-password"
import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { MainLayout } from "../MainLayout"

/**
 * As telas públicas são casca: painel de marca à esquerda, formulário à
 * direita. O que os testes guardam é a composição — cada formulário tem o
 * teste dele.
 */
vi.mock("@/pages/login/components/LoginForm", () => ({
  LoginForm: () => <span>form-login</span>,
}))
vi.mock("@/pages/forgot-password/components/ForgotPasswordForm", () => ({
  ForgotPasswordForm: () => <span>form-esqueci-senha</span>,
}))
vi.mock("@/pages/reset-password/components/ResetPasswordForm", () => ({
  ResetPasswordForm: () => <span>form-redefinir-senha</span>,
}))
vi.mock("@/shared/components/brand/BrandPanel", () => ({
  BrandPanel: () => <span>painel-de-marca</span>,
}))
// O shell autenticado monta sidebar, header e barra de abas — cada um com sua
// própria rede. Aqui interessa apenas que os três entram, e uma vez só.
vi.mock("@/shared/components/sidebar/Sidebar", () => ({
  Sidebar: () => <span>sidebar</span>,
}))
vi.mock("@/shared/components/header/Header", () => ({
  Header: () => <span>header</span>,
}))
vi.mock("@/shared/components/mobile/BottomTabBar", () => ({
  BottomTabBar: () => <span>barra-de-abas</span>,
}))
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(() => ({
    profile: "engenheiro",
    obraId: null,
    isLoading: false,
    levelOf: (_m: AppModule) => "w" as const,
    canSee: () => true,
    isReadOnly: () => false,
  })),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => null),
}))

beforeEach(() => {
  vi.clearAllMocks()
})

describe("telas públicas", () => {
  it.each([
    [<LoginPage key="l" />, "form-login"],
    [<ForgotPasswordPage key="f" />, "form-esqueci-senha"],
    [<ResetPasswordPage key="r" />, "form-redefinir-senha"],
  ])("compõe o painel de marca com o formulário (%#)", (pagina, marcador) => {
    renderWithProviders(pagina)

    expect(screen.getByText("painel-de-marca")).toBeInTheDocument()
    expect(screen.getByText(marcador)).toBeInTheDocument()
  })
})

/**
 * Duas navegações que não coexistem: sidebar a partir de `lg`, barra de abas
 * com FAB abaixo disso. As duas são montadas e o CSS decide qual aparece — a
 * gaveta que a sidebar era no celular saiu.
 */
describe("<MainLayout />", () => {
  function render(route = "/dashboard") {
    return renderWithProviders(
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/dashboard" element={<span>conteúdo da rota</span>} />
          <Route path="/obras" element={<span>outra rota</span>} />
        </Route>
      </Routes>,
      { route },
    )
  }

  it("monta sidebar, header e barra de abas em volta do conteúdo", () => {
    render()

    expect(screen.getByText("sidebar")).toBeInTheDocument()
    expect(screen.getByText("header")).toBeInTheDocument()
    expect(screen.getByText("barra-de-abas")).toBeInTheDocument()
    expect(screen.getByText("conteúdo da rota")).toBeInTheDocument()
  })

  it("troca só o conteúdo ao navegar", () => {
    render("/obras")

    expect(screen.getByText("outra rota")).toBeInTheDocument()
    expect(screen.getByText("sidebar")).toBeInTheDocument()
  })
})
