import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { useLocation } from "react-router-dom"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { Project } from "@/shared/types/project"
import { renderWithProviders } from "@/test/renderWithProviders"

import { CommandPaletteProvider } from "../CommandPaletteProvider"

vi.mock("@/shared/hooks/useAccess", () => ({
  useAccess: vi.fn(),
  useCurrentModule: vi.fn(() => null),
  useObraIdFromPath: vi.fn(() => 7),
}))
vi.mock("@/shared/hooks/useProjectList", () => ({ useProjectList: vi.fn() }))

const { useAccess } = await import("@/shared/hooks/useAccess")
const { useProjectList } = await import("@/shared/hooks/useProjectList")

function Url() {
  const { pathname } = useLocation()
  return <span data-testid="url">{pathname}</span>
}

/**
 * A busca não faz chamada nova: obras vêm da lista do shell, etapas e tarefas
 * do cache da obra aberta. O teste semeia esse cache como a tela de etapas o
 * deixaria.
 */
function render() {
  const client = new QueryClient()
  client.setQueryData(["stages", 7], [{ id: 1, name: "Fundação" }])
  client.setQueryData(["tarefas", 1], [{ id: 10, title: "Concretar sapatas" }])

  return renderWithProviders(
    <QueryClientProvider client={client}>
      <CommandPaletteProvider>
        <Url />
      </CommandPaletteProvider>
    </QueryClientProvider>,
    { route: "/obras/7/visao-geral" },
  )
}

async function buscar(termo: string) {
  await userEvent.keyboard("{Control>}k{/Control}")
  await userEvent.type(await screen.findByRole("textbox", { name: "Buscar" }), termo)
}

beforeEach(() => {
  vi.mocked(useAccess).mockReturnValue({
    profile: "engenheiro",
    obraId: 7,
    isLoading: false,
    levelOf: () => "w",
    canSee: () => true,
    isReadOnly: () => false,
  })
  vi.mocked(useProjectList).mockReturnValue([
    { id: 7, title: "Residência Mercês", neighborhood: "Mercês", city: "Curitiba" } as Project,
  ])
})

describe("comandos da busca ⌘K", () => {
  it("encontra a obra sem acento e abre ela", async () => {
    render()
    await buscar("merces")

    await userEvent.click(screen.getByRole("option", { name: /Residência Mercês/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7")
  })

  it("encontra etapa e tarefa da obra aberta, levando ao módulo certo", async () => {
    render()
    await buscar("concretar")

    await userEvent.click(screen.getByRole("option", { name: /Concretar sapatas/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/tarefas")
  })

  it("leva à etapa pelo módulo de etapas", async () => {
    render()
    await buscar("funda")

    // A tarefa também cita a etapa como contexto; a primeira linha é a etapa.
    const [etapa] = screen.getAllByRole("option", { name: /Fundação/ })
    await userEvent.click(etapa)

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/etapas")
  })

  it("inclui os módulos da obra aberta em Ir para", async () => {
    render()
    await buscar("orçamento")

    await userEvent.click(screen.getByRole("option", { name: /Orçamento/ }))

    expect(screen.getByTestId("url")).toHaveTextContent("/obras/7/orcamento")
  })

  it("alterna o tema e fecha", async () => {
    render()
    await buscar("tema")

    await userEvent.click(screen.getByRole("option", { name: /Alternar tema/ }))

    expect(document.documentElement).toHaveAttribute("data-theme", "light")
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("fecha ao clicar fora do painel", async () => {
    render()
    await buscar("x")

    await userEvent.click(screen.getByRole("dialog").parentElement as HTMLElement)

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })
})
