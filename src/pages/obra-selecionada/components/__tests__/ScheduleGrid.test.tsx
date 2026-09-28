import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { RoleInProject } from "../../types/equipes"
import { ScheduleView, type DaySchedule, type TeamSchedule } from "../../types/schedule"
import { ScheduleGrid } from "../ScheduleGrid"

/**
 * A grade é o contrato visual da feature: uma linha por integrante, uma coluna
 * por dia da resposta. O que este teste protege é a correspondência — filtrar,
 * reordenar ou esconder coluna aqui faz o total da linha não bater com as
 * células, e ninguém percebe olhando a tela.
 */

const DIAS = [
  "2026-08-10",
  "2026-08-11",
  "2026-08-12",
  "2026-08-13",
  "2026-08-14",
  "2026-08-15",
  "2026-08-16",
]

function dia(date: string, horas = 0, overlapped = false): DaySchedule {
  return {
    date,
    allocatedHours: horas,
    allocated: horas > 0,
    overlapped,
    tasks: overlapped
      ? [
          {
            id: 1,
            title: "Concretagem",
            status: "IN_PROGRESS",
            priority: "HIGH",
            stageId: 4,
            stageName: "Estrutura",
            plannedStartDate: date,
            plannedEndDate: date,
          },
          {
            id: 2,
            title: "Fôrmas",
            status: "TODO",
            priority: "MEDIUM",
            stageId: 4,
            stageName: "Estrutura",
            plannedStartDate: date,
            plannedEndDate: date,
          },
        ]
      : [],
  }
}

const SEMANA: TeamSchedule = {
  constructionProjectId: 7,
  view: ScheduleView.WEEK,
  startDate: "2026-08-10",
  endDate: "2026-08-16",
  previousDate: "2026-08-03",
  nextDate: "2026-08-17",
  days: DIAS,
  members: [
    {
      userId: 10,
      userName: "João Souza",
      roleInProject: RoleInProject.ENGINEER,
      userResponsibility: "Estrutura",
      totalAllocatedHours: 8,
      hasOverlap: false,
      days: [dia(DIAS[0], 8), ...DIAS.slice(1).map((d) => dia(d))],
    },
    {
      userId: 11,
      userName: "Maria Reis",
      roleInProject: RoleInProject.FOREMAN,
      userResponsibility: null,
      totalAllocatedHours: 8,
      hasOverlap: true,
      days: [dia(DIAS[0]), dia(DIAS[1], 8, true), ...DIAS.slice(2).map((d) => dia(d))],
    },
  ],
}

function montar(canMutate = true) {
  const onSelectDay = vi.fn()
  const onEditResponsibility = vi.fn()

  renderWithProviders(
    <ScheduleGrid
      schedule={SEMANA}
      canMutate={canMutate}
      onSelectDay={onSelectDay}
      onEditResponsibility={onEditResponsibility}
    />,
  )

  return { onSelectDay, onEditResponsibility }
}

describe("colunas", () => {
  // O protótipo desenha Seg–Sex, mas o período do backend vai de segunda a
  // domingo e o total da linha soma os sete dias.
  it("mostra os sete dias da semana que a resposta trouxe", () => {
    montar()

    expect(screen.getByRole("columnheader", { name: "Seg 10" })).toBeInTheDocument()
    expect(screen.getByRole("columnheader", { name: "Dom 16" })).toBeInTheDocument()
    expect(screen.getAllByRole("columnheader")).toHaveLength(DIAS.length + 1)
  })

  // No mês são 28–31 colunas: só o número do dia cabe.
  it("reduz o cabeçalho ao número do dia na visão de mês", () => {
    renderWithProviders(
      <ScheduleGrid
        schedule={{ ...SEMANA, view: ScheduleView.MONTH }}
        canMutate
        onSelectDay={vi.fn()}
        onEditResponsibility={vi.fn()}
      />,
    )

    expect(screen.getByRole("columnheader", { name: "10" })).toBeInTheDocument()
    expect(screen.queryByRole("columnheader", { name: "Seg 10" })).not.toBeInTheDocument()
  })

  it("atenua a coluna de fim de semana", () => {
    montar()

    const sabado = screen.getByRole("button", { name: /Maria Reis, 15\/08\/2026/ })
    const util = screen.getByRole("button", { name: /Maria Reis, 13\/08\/2026/ })

    expect(sabado.closest("td")?.className).toContain("opacity-60")
    expect(util.closest("td")?.className).not.toContain("opacity-60")
  })
})

describe("linhas", () => {
  it("mantém a ordem dos integrantes da resposta", () => {
    montar()

    const linhas = screen.getAllByRole("rowheader")

    expect(linhas[0]).toHaveTextContent("João Souza")
    expect(linhas[1]).toHaveTextContent("Maria Reis")
  })

  it("mostra a frente de trabalho, e o aviso quando não há", () => {
    montar()

    expect(screen.getByText("Estrutura")).toBeInTheDocument()
    expect(screen.getByText("Sem frente definida")).toBeInTheDocument()
  })
})

describe("células", () => {
  it("escreve as horas no dia alocado", () => {
    montar()

    // Duas células alocadas na amostra: a de João e a sobreposta de Maria.
    expect(screen.getAllByText("8h")).toHaveLength(2)
  })

  // Dia livre é ausência de alocação — "0h" sugeriria uma alocação de zero,
  // que nem existe no banco.
  it("não escreve 0h no dia livre", () => {
    montar()

    expect(screen.queryByText("0h")).not.toBeInTheDocument()
  })

  it("descreve o estado da célula sem depender da cor", () => {
    montar()

    expect(
      screen.getByRole("button", { name: "João Souza, 10/08/2026: 8h alocadas" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "João Souza, 11/08/2026: dia livre" }),
    ).toBeInTheDocument()
  })

  it("lista as tarefas do dia em sobreposição", () => {
    montar()

    const conflito = screen.getByRole("button", {
      name: "Maria Reis, 11/08/2026: 8h alocadas, 2 tarefas no mesmo dia",
    })

    expect(conflito).toHaveAttribute("title", expect.stringContaining("Concretagem · Fôrmas"))
  })
})

describe("permissão", () => {
  it("abre a alocação da célula clicada", async () => {
    const { onSelectDay } = montar()

    await userEvent.click(screen.getByRole("button", { name: /João Souza, 10\/08\/2026/ }))

    expect(onSelectDay).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 10 }),
      expect.objectContaining({ date: "2026-08-10" }),
    )
  })

  it("abre a frente de trabalho pelo nome do integrante", async () => {
    const { onEditResponsibility } = montar()

    await userEvent.click(
      screen.getByRole("button", { name: "Editar a frente de trabalho de João Souza" }),
    )

    expect(onEditResponsibility).toHaveBeenCalledWith(expect.objectContaining({ userId: 10 }))
  })

  // Sem MANAGE_TEAMS a grade é leitura: nada de botão que só levaria 403.
  it("não oferece botão quando o papel não edita", () => {
    montar(false)

    expect(screen.queryAllByRole("button")).toHaveLength(0)
    expect(
      screen.getByRole("img", { name: "João Souza, 10/08/2026: 8h alocadas" }),
    ).toBeInTheDocument()
  })
})
