import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { EtapaStatus } from "@/pages/projetos/types"
import { renderWithProviders } from "@/test/renderWithProviders"

import type { Stage } from "../../services/stages.service"
import { EtapaCard } from "../EtapaCard"

const VENCIDO = "2020-01-01"
const FUTURO = "2099-12-31"

function etapa(over: Partial<Stage> = {}): Stage {
  return {
    id: 1,
    constructionProjectId: 7,
    name: "Fundação",
    description: "Sapatas e baldrame",
    displayOrder: 2,
    status: EtapaStatus.IN_PROGRESS,
    plannedStartDate: "2026-03-01",
    plannedEndDate: FUTURO,
    actualStartDate: null,
    actualEndDate: null,
    createdAt: "2026-01-01T00:00:00Z",
    updatedAt: "2026-01-01T00:00:00Z",
    ...over,
  }
}

const onClick = vi.fn()
const onDelete = vi.fn()

function render(stage = etapa(), props: Partial<Parameters<typeof EtapaCard>[0]> = {}) {
  return renderWithProviders(
    <ul>
      <EtapaCard stage={stage} photoCount={0} onClick={onClick} onDelete={onDelete} canMutate {...props} />
    </ul>,
  )
}

beforeEach(() => {
  vi.resetAllMocks()
})

describe("<EtapaCard />", () => {
  it("mostra ordem, nome, descrição e datas", () => {
    render()

    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByRole("heading", { name: "Fundação" })).toBeInTheDocument()
    expect(screen.getByText("Sapatas e baldrame")).toBeInTheDocument()
  })

  // Sem descrição a linha secundária vira a contagem de fotos, em vez de ficar
  // vazia e desalinhar a altura dos cards.
  it("cai na contagem de fotos quando não há descrição", () => {
    render(etapa({ description: null }), { photoCount: 3 })

    expect(screen.getByText("3 fotos")).toBeInTheDocument()
  })

  it("usa um traço no lugar das datas ausentes", () => {
    render(etapa({ plannedStartDate: null, plannedEndDate: null }))

    expect(screen.getByText(/—.*–.*—/)).toBeInTheDocument()
  })

  it("deriva o progresso do status", () => {
    render(etapa({ status: EtapaStatus.DONE }))

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "100")
  })

  // "Em atraso" vem da data, não do status: o card destaca os dias e troca o
  // tom da barra.
  it("destaca os dias de atraso quando o prazo passou", () => {
    render(etapa({ plannedEndDate: VENCIDO }))

    expect(screen.getByText("Em atraso")).toBeInTheDocument()
    // Dois avisos: o do badge e a linha com a contagem de dias sob ele.
    expect(screen.getAllByText(/⚠/)).toHaveLength(2)
    expect(screen.getByText(/dias?$/)).toBeInTheDocument()
  })

  it("não acusa atraso dentro do prazo", () => {
    render()

    expect(screen.queryByText("Em atraso")).not.toBeInTheDocument()
  })

  it("abre a etapa ao clicar na linha", async () => {
    const stage = etapa()
    render(stage)

    await userEvent.click(screen.getByRole("heading", { name: "Fundação" }))

    expect(onClick).toHaveBeenCalledWith(stage)
  })

  /**
   * A alça é o único ponto de arraste: com a linha inteira arrastável, no
   * celular qualquer rolagem virava um drag. Ela também não pode abrir a
   * etapa — daí a marcação que o clique da linha ignora.
   */
  it("não abre a etapa ao usar a alça de arraste", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Reordenar etapa" }))

    expect(onClick).not.toHaveBeenCalled()
  })

  it("esconde a alça de quem não pode reordenar", () => {
    render(etapa(), { disableDrag: true })

    expect(screen.queryByRole("button", { name: "Reordenar etapa" })).not.toBeInTheDocument()
  })

  it("esconde o menu de quem não pode editar", () => {
    render(etapa(), { canMutate: false })

    expect(screen.queryByRole("button", { name: "Ações da etapa" })).not.toBeInTheDocument()
  })
})

describe("<EtapaCard /> — menu da linha", () => {
  it("começa fechado", () => {
    render()

    expect(screen.queryByText("Editar")).not.toBeInTheDocument()
  })

  it("abre no botão de ações", async () => {
    render()

    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))

    expect(screen.getByText("Editar")).toBeInTheDocument()
    expect(screen.getByText("Excluir")).toBeInTheDocument()
  })

  it("edita e fecha o menu", async () => {
    const stage = etapa()
    render(stage)
    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))

    await userEvent.click(screen.getByText("Editar"))

    expect(onClick).toHaveBeenCalledWith(stage)
    expect(screen.queryByText("Excluir")).not.toBeInTheDocument()
  })

  it("pede a exclusão e fecha o menu", async () => {
    const stage = etapa()
    render(stage)
    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))

    await userEvent.click(screen.getByText("Excluir"))

    expect(onDelete).toHaveBeenCalledWith(stage)
  })

  // A camada de captura fecha o menu sem listener global no documento.
  it("fecha ao clicar fora", async () => {
    render()
    await userEvent.click(screen.getByRole("button", { name: "Ações da etapa" }))

    await userEvent.click(document.querySelector(".fixed.inset-0") as HTMLElement)

    expect(screen.queryByText("Editar")).not.toBeInTheDocument()
  })
})
