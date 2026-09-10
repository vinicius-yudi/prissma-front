import { screen } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { Header } from "../Header"

// A matriz de acesso tem teste próprio (useAccess.test.tsx); aqui a fronteira
// da unidade é o que o header DESENHA a partir dela.
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(),
  useObraIdFromPath: vi.fn(() => null),
}))

const { useAccess, useCurrentModule } = await import("@/shared/hooks/useAccess")
const acesso = vi.mocked(useAccess)
const moduloAtual = vi.mocked(useCurrentModule)

function mockAcesso(isReadOnly: boolean) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: () => (isReadOnly ? "r" : "w"),
    canSee: () => true,
    isReadOnly: () => isReadOnly,
  })
}

beforeEach(() => {
  vi.resetAllMocks()
  moduloAtual.mockReturnValue("etapas" as AppModule)
  mockAcesso(false)
})

describe("<Header />", () => {
  it("mostra a marca, a busca e os controles de tema e idioma", () => {
    renderWithProviders(<Header />)

    expect(screen.getByAltText("PRISSMA")).toBeInTheDocument()
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
    expect(screen.getByRole("button", { name: /modo/ })).toBeInTheDocument()
  })

  /**
   * O aviso sai da mesma matriz que gera a sidebar: nenhuma tela precisa
   * declarar que está em modo leitura, e não há como uma esquecer.
   */
  it("avisa somente-leitura quando o papel só lê o módulo aberto", () => {
    mockAcesso(true)

    renderWithProviders(<Header />)

    expect(screen.getByLabelText("Somente leitura no seu perfil")).toBeInTheDocument()
  })

  it("não avisa quando o papel edita o módulo", () => {
    renderWithProviders(<Header />)

    expect(screen.queryByLabelText("Somente leitura no seu perfil")).not.toBeInTheDocument()
  })

  // Fora de um módulo conhecido não há o que restringir — o aviso ficaria sem
  // referente.
  it("não avisa fora de um módulo reconhecido, mesmo em modo leitura", () => {
    moduloAtual.mockReturnValue(null)
    mockAcesso(true)

    renderWithProviders(<Header />)

    expect(screen.queryByLabelText("Somente leitura no seu perfil")).not.toBeInTheDocument()
  })
})
