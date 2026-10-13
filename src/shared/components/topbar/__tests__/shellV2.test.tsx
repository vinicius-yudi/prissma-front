import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { Upload } from "lucide-react"
import { useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { MobileActionButton } from "@/shared/components/mobile/MobileActionButton"
import { MobileNav } from "@/shared/components/mobile/MobileNav"
import { PrimaryActionProvider } from "@/shared/components/ui/page-chrome/PrimaryActionProvider"
import { usePrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import type { PrimaryAction } from "@/shared/components/ui/page-chrome/primaryAction"
import type { AppModule } from "@/shared/constants/access"
import { renderWithProviders } from "@/test/renderWithProviders"

import { CommandPaletteProvider } from "../../command-palette/CommandPaletteProvider"
import { Topbar } from "../Topbar"

// A matriz tem teste próprio; aqui a fronteira é o que o shell desenha dela.
vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(),
  useObraIdFromPath: vi.fn(() => null),
}))
vi.mock("@/shared/hooks/useProjectList", () => ({ useProjectList: vi.fn(() => []) }))

const { useAccess, useCurrentModule } = await import("@/shared/hooks/useAccess")
const acesso = vi.mocked(useAccess)
const moduloAtual = vi.mocked(useCurrentModule)

interface AcessoOpts {
  ocultos?: AppModule[]
  somenteLeitura?: AppModule[]
}

function mockAcesso({ ocultos = [], somenteLeitura = [] }: AcessoOpts = {}) {
  acesso.mockReturnValue({
    profile: "engenheiro",
    obraId: null,
    isLoading: false,
    levelOf: (m) => (ocultos.includes(m) ? "" : somenteLeitura.includes(m) ? "r" : "w"),
    canSee: (m) => !ocultos.includes(m),
    isReadOnly: (m) => somenteLeitura.includes(m),
  })
}

function Url() {
  const { pathname, search } = useLocation()
  return <span data-testid="url">{pathname + search}</span>
}

beforeEach(() => {
  vi.clearAllMocks()
  moduloAtual.mockReturnValue(null)
  mockAcesso()
})

describe("<Topbar />", () => {
  function render(route = "/dashboard") {
    return renderWithProviders(
      <CommandPaletteProvider>
        <Topbar />
        <Url />
      </CommandPaletteProvider>,
      { route },
    )
  }

  it("abre a busca ⌘K pelo gatilho", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Buscar" }))

    expect(screen.getByRole("dialog", { name: "Buscar" })).toBeInTheDocument()
  })

  it("leva ao cadastro de obra por Nova obra", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: /Nova obra/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras?nova=1")
  })

  // Na lista de obras a página já tem a primária: duas competem.
  it("esconde Nova obra na própria lista de obras e de quem só lê", () => {
    const { unmount } = render("/obras")
    expect(screen.queryByRole("button", { name: /Nova obra/ })).not.toBeInTheDocument()
    unmount()

    mockAcesso({ somenteLeitura: ["obras"] })
    render()
    expect(screen.queryByRole("button", { name: /Nova obra/ })).not.toBeInTheDocument()
  })

  it("avisa somente-leitura quando o papel só lê o módulo aberto", () => {
    moduloAtual.mockReturnValue("etapas")
    mockAcesso({ somenteLeitura: ["etapas"] })

    render()

    expect(screen.getByLabelText("Somente leitura no seu perfil")).toBeInTheDocument()
  })
})

describe("busca ⌘K", () => {
  function render() {
    return renderWithProviders(
      <CommandPaletteProvider>
        <Url />
      </CommandPaletteProvider>,
      { route: "/dashboard" },
    )
  }

  async function abrir() {
    await userEvent.keyboard("{Control>}k{/Control}")
    return screen.findByRole("dialog", { name: "Buscar" })
  }

  it("abre e fecha pelo atalho", async () => {
    render()

    await abrir()
    await userEvent.keyboard("{Escape}")

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("lista ações e destinos sem termo", async () => {
    render()
    await abrir()

    expect(screen.getByRole("option", { name: /Nova obra/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Início/ })).toBeInTheDocument()
  })

  // "merces" encontra "Mercês" e, sem lista na tela, o termo vira busca de obras.
  it("ignora acento e oferece buscar obras pelo termo", async () => {
    render()
    await abrir()

    await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "inicio")

    expect(screen.getByRole("option", { name: /Início/ })).toBeInTheDocument()
    expect(screen.getByRole("option", { name: /Buscar obras por/ })).toBeInTheDocument()
  })

  it("move o destaque com as setas e executa no Enter", async () => {
    render()
    await abrir()

    await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "obras")
    await userEvent.keyboard("{ArrowDown}{ArrowUp}{Enter}")

    expect(screen.getByTestId("url")).toHaveTextContent("/obras?q=obras")
  })

  it("avisa quando nada casa", async () => {
    render()
    await abrir()

    await userEvent.type(screen.getByRole("textbox", { name: "Buscar" }), "zzzz")
    // A ação "Buscar obras por" sempre casa com o próprio termo; o resto some.
    expect(screen.queryByRole("option", { name: /Início/ })).not.toBeInTheDocument()
  })
})

describe("<MobileNav />", () => {
  it("mostra os quatro destinos do celular", () => {
    renderWithProviders(<MobileNav />, { route: "/obras" })

    expect(screen.getByRole("link", { name: /Início/ })).toHaveAttribute("href", "/dashboard")
    expect(screen.getByRole("link", { name: /Obras/ })).toHaveAttribute("aria-current", "page")
    expect(screen.getByRole("link", { name: /Pessoas/ })).toHaveAttribute("href", "/pessoas")
    expect(screen.getByRole("link", { name: /Perfil/ })).toHaveAttribute("href", "/perfil")
  })

  it("esconde o destino que a matriz oculta, mas nunca o perfil", () => {
    mockAcesso({ ocultos: ["pessoas", "home"] })

    renderWithProviders(<MobileNav />)

    expect(screen.queryByRole("link", { name: /Pessoas/ })).not.toBeInTheDocument()
    expect(screen.getByRole("link", { name: /Perfil/ })).toBeInTheDocument()
  })
})

describe("<MobileActionButton />", () => {
  function Tela({ action }: { action: PrimaryAction | null }) {
    usePrimaryAction(action)
    return null
  }

  it("não aparece sem ação registrada", () => {
    renderWithProviders(
      <PrimaryActionProvider>
        <Tela action={null} />
        <MobileActionButton />
      </PrimaryActionProvider>,
    )

    expect(screen.queryByRole("button")).not.toBeInTheDocument()
  })

  it("dispara a ação da tela, com o rótulo curto visível", async () => {
    const onClick = vi.fn()
    renderWithProviders(
      <PrimaryActionProvider>
        <Tela action={{ label: "Enviar documento", shortLabel: "Enviar", icon: Upload, onClick }} />
        <MobileActionButton />
      </PrimaryActionProvider>,
    )

    await userEvent.click(screen.getByRole("button", { name: "Enviar documento" }))

    expect(onClick).toHaveBeenCalled()
    expect(screen.getByText("Enviar")).toBeInTheDocument()
  })

  it("desabilita quando a tela pede", () => {
    renderWithProviders(
      <PrimaryActionProvider>
        <Tela action={{ label: "Nova tarefa", onClick: vi.fn(), disabled: true }} />
        <MobileActionButton />
      </PrimaryActionProvider>,
    )

    expect(screen.getByRole("button", { name: "Nova tarefa" })).toBeDisabled()
  })
})
