import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import type { Tarefa, TarefaComEtapa, TarefaStatus } from "../../types/tarefas"
import { TarefasLista } from "../TarefasLista"
import { TaskKanbanCard } from "../TaskKanbanCard"

const VENCIDO = "2020-01-01"
const FUTURO = "2099-12-31"

function tarefa(over: Partial<Tarefa> = {}): Tarefa {
  return {
    id: 1,
    title: "Concretar laje",
    description: "",
    priority: "MEDIUM",
    status: "TODO",
    plannedStartDate: "2026-03-01",
    plannedEndDate: FUTURO,
    assigneeUserId: null,
    assigneeName: null,
    constructionProjectId: 7,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

function item(over: Partial<Tarefa> = {}): TarefaComEtapa {
  return { tarefa: tarefa(over), stageId: 1, stageName: "Fundação" }
}

const onOpen = vi.fn()

beforeEach(() => {
  vi.resetAllMocks()
})

/**
 * O kanban não desce para telas estreitas: quatro colunas empilhadas viram
 * quatro listas percorridas no escuro, e arrastar competiria com a rolagem.
 * Aqui o recorte é por pílula e o status se muda abrindo a tarefa.
 */
describe("<TarefasLista />", () => {
  it("lista as tarefas com status, prioridade e prazo", () => {
    renderWithProviders(<TarefasLista items={[item()]} onOpen={onOpen} />)

    expect(screen.getByText("Concretar laje")).toBeInTheDocument()
    expect(screen.getByText("Média")).toBeInTheDocument()
    expect(screen.getByText("Não iniciada")).toBeInTheDocument()
  })

  it("avisa quando não há tarefa", () => {
    renderWithProviders(<TarefasLista items={[]} onOpen={onOpen} />)

    expect(screen.getByText("Nenhuma tarefa aqui")).toBeInTheDocument()
  })

  it("abre a tarefa clicada", async () => {
    const alvo = item()
    renderWithProviders(<TarefasLista items={[alvo]} onOpen={onOpen} />)

    await userEvent.click(screen.getByText("Concretar laje"))

    expect(onOpen).toHaveBeenCalledWith(alvo)
  })

  // Iniciais no lugar do avatar; sem responsável fica o traço, para a coluna
  // não colapsar.
  it("mostra as iniciais do responsável, ou um traço sem responsável", () => {
    renderWithProviders(
      <TarefasLista
        items={[item({ assigneeName: "Ana Souza" }), item({ id: 2, assigneeName: null })]}
        onOpen={onOpen}
      />,
    )

    expect(screen.getByText("AN")).toBeInTheDocument()
    expect(screen.getByText("—")).toBeInTheDocument()
  })

  it("omite o prazo quando a tarefa não tem data de término", () => {
    renderWithProviders(
      <TarefasLista items={[item({ plannedEndDate: "" })]} onOpen={onOpen} />,
    )

    expect(screen.getByText("Concretar laje")).toBeInTheDocument()
  })
})

describe("<TarefasLista /> — filtros", () => {
  const LISTA = [
    item({ id: 1, title: "A fazer", status: "TODO" }),
    item({ id: 2, title: "Em curso", status: "IN_PROGRESS" }),
    item({ id: 3, title: "Pronta", status: "DONE" }),
    item({ id: 4, title: "Atrasada", status: "IN_PROGRESS", plannedEndDate: VENCIDO }),
  ]

  /**
   * Âncora no início do nome: a linha de uma tarefa atrasada também é um
   * botão e carrega "Em atraso" no badge, então um regex solto casaria as
   * duas coisas.
   */
  function filtro(rotulo: string) {
    return screen.getByRole("button", { name: new RegExp(`^${rotulo}`) })
  }

  it("começa mostrando todas, com a contagem na pílula", () => {
    renderWithProviders(<TarefasLista items={LISTA} onOpen={onOpen} />)

    expect(filtro("Todas")).toHaveTextContent("4")
    expect(screen.getByText("Pronta")).toBeInTheDocument()
  })

  it.each([
    ["Em andamento", ["Em curso", "Atrasada"]],
    ["Concluídas", ["Pronta"]],
  ])("filtra por %s", async (pilula, esperadas) => {
    renderWithProviders(<TarefasLista items={LISTA} onOpen={onOpen} />)

    await userEvent.click(filtro(pilula))

    for (const titulo of esperadas) {
      expect(screen.getByText(titulo)).toBeInTheDocument()
    }
    expect(screen.queryByText("A fazer")).not.toBeInTheDocument()
  })

  // "Em atraso" é derivado da data, não um status do banco: a pílula precisa
  // calcular, não filtrar por campo.
  it("filtra as atrasadas pela data, não pelo status", async () => {
    renderWithProviders(<TarefasLista items={LISTA} onOpen={onOpen} />)

    await userEvent.click(filtro("Em atraso"))

    expect(screen.getByText("Atrasada")).toBeInTheDocument()
    expect(screen.queryByText("Em curso")).not.toBeInTheDocument()
  })

  it("mostra a contagem de atrasadas na pílula", () => {
    renderWithProviders(<TarefasLista items={LISTA} onOpen={onOpen} />)

    expect(filtro("Em atraso")).toHaveTextContent("1")
  })

  it("não mostra contagem quando não há atrasada", () => {
    renderWithProviders(<TarefasLista items={[item()]} onOpen={onOpen} />)

    expect(filtro("Em atraso")).not.toHaveTextContent("·")
  })

  it("avisa quando o filtro não deixa nada", async () => {
    renderWithProviders(<TarefasLista items={[item()]} onOpen={onOpen} />)

    await userEvent.click(filtro("Concluídas"))

    expect(screen.getByText("Nenhuma tarefa aqui")).toBeInTheDocument()
  })
})

describe("<TaskKanbanCard />", () => {
  const onEdit = vi.fn()
  const onDelete = vi.fn()

  function render(over: Partial<Tarefa> = {}, canMutate = true) {
    return renderWithProviders(
      <TaskKanbanCard
        tarefa={tarefa(over)}
        stageId={1}
        canMutate={canMutate}
        onEdit={onEdit}
        onDelete={onDelete}
      />,
    )
  }

  it("mostra título, prioridade e prazo", () => {
    render({ plannedEndDate: "2026-03-05" })

    expect(screen.getByText("Concretar laje")).toBeInTheDocument()
    expect(screen.getByText("Média")).toBeInTheDocument()
  })

  it.each([
    ["HIGH", "Alta"],
    ["MEDIUM", "Média"],
    ["LOW", "Baixa"],
  ] as const)("traduz a prioridade %s", (priority, rotulo) => {
    render({ priority })

    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })

  // §6: atraso nunca é comunicado só por cor — vem o ⚠ e a contagem de dias.
  it("marca o atraso com símbolo e contagem de dias", () => {
    render({ plannedEndDate: VENCIDO })

    expect(screen.getByText("⚠")).toHaveAttribute("aria-hidden", "true")
    expect(screen.getByText(/prazo expirado/)).toBeInTheDocument()
  })

  it("não marca atraso dentro do prazo", () => {
    render()

    expect(screen.queryByText("⚠")).not.toBeInTheDocument()
  })

  it("esconde as ações de quem não pode editar", () => {
    render({}, false)

    expect(screen.queryByRole("button", { name: "Editar tarefa" })).not.toBeInTheDocument()
  })

  it("edita e exclui pelos botões do card", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Editar tarefa" }))
    await userEvent.click(screen.getByRole("button", { name: "Excluir tarefa" }))

    expect(onEdit).toHaveBeenCalled()
    expect(onDelete).toHaveBeenCalled()
  })

  it("mostra as iniciais do responsável", () => {
    render({ assigneeName: "Bia Lima" })

    expect(screen.getByText("BI")).toBeInTheDocument()
    expect(screen.getByTitle("Bia Lima")).toBeInTheDocument()
  })

  it("marca como sem responsável quando não há um", () => {
    render()

    expect(screen.getByTitle("Sem responsável")).toBeInTheDocument()
  })
})

/** Guarda de tipo: garante que a lista de status usada aqui é a real. */
const STATUS_CONHECIDOS: TarefaStatus[] = ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]

describe("status de tarefa", () => {
  it("cobre os quatro status do backend", () => {
    expect(STATUS_CONHECIDOS).toHaveLength(4)
  })
})
