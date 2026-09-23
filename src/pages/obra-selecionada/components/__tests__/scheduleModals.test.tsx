import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { RoleInProject } from "../../types/equipes"
import type { DaySchedule, MemberSchedule } from "../../types/schedule"
import { AllocationModal } from "../AllocationModal"
import { ResponsibilityModal } from "../ResponsibilityModal"

/**
 * Os dois formulários da tela. O que eles precisam provar é que o erro aparece
 * **no campo** (toast é para erro de servidor) e que liberar o dia — a única
 * ação destrutiva daqui — pede confirmação antes de apagar a alocação.
 */

const MEMBRO: MemberSchedule = {
  userId: 10,
  userName: "João Souza",
  roleInProject: RoleInProject.ENGINEER,
  userResponsibility: "Estrutura",
  totalAllocatedHours: 8,
  hasOverlap: false,
  days: [],
}

function dia(over: Partial<DaySchedule> = {}): DaySchedule {
  return {
    date: "2026-08-10",
    allocatedHours: 8,
    allocated: true,
    overlapped: false,
    tasks: [],
    ...over,
  }
}

function montarAlocacao(day = dia(), isSaving = false) {
  const onSave = vi.fn()
  const onClose = vi.fn()

  renderWithProviders(
    <AllocationModal
      member={MEMBRO}
      day={day}
      isSaving={isSaving}
      onClose={onClose}
      onSave={onSave}
    />,
  )

  return { onSave, onClose }
}

describe("AllocationModal", () => {
  // Campo pré-preenchido convida a salvar sem ler — e salvar sem ler aqui
  // sobrescreve a alocação de outra pessoa. O valor atual fica no placeholder.
  it("abre vazio, com as horas atuais só como pista", () => {
    montarAlocacao()

    const campo = screen.getByLabelText("Horas do dia")

    expect(campo).toHaveValue("")
    expect(campo).toHaveAttribute("placeholder", "8")
    expect(screen.getByText("João Souza · 10/08/2026")).toBeInTheDocument()
  })

  it("não oferece pista num dia livre", () => {
    montarAlocacao(dia({ allocatedHours: 0, allocated: false }))

    expect(screen.getByLabelText("Horas do dia")).not.toHaveAttribute("placeholder")
  })

  it("salva as horas digitadas", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.type(screen.getByLabelText("Horas do dia"), "6")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(onSave).toHaveBeenCalledWith(6)
  })

  // O máximo é 24: nenhum valor legítimo passa de dois dígitos, e sem o limite
  // dava para digitar 999 e só descobrir o erro depois do submit.
  it("não deixa passar de dois dígitos", async () => {
    montarAlocacao()

    const campo = screen.getByLabelText("Horas do dia")
    await userEvent.type(campo, "999")

    expect(campo).toHaveValue("99")
  })

  it("cobra o valor quando o campo fica vazio", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe as horas do dia")
    expect(onSave).not.toHaveBeenCalled()
  })

  // Erro de campo fica no campo — toast é reservado a erro de servidor.
  it("recusa acima de 24 horas sem chamar o backend", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.type(screen.getByLabelText("Horas do dia"), "25")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "As horas devem ficar entre 0 e 24",
    )
    expect(onSave).not.toHaveBeenCalled()
  })

  it("recusa texto que não é número", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.type(screen.getByLabelText("Horas do dia"), "ab")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Informe as horas do dia")
    expect(onSave).not.toHaveBeenCalled()
  })

  it("pede confirmação antes de liberar o dia", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.click(screen.getByRole("button", { name: "Liberar o dia" }))

    expect(
      screen.getByText("Liberar o dia de João Souza em 10/08/2026? A alocação é apagada."),
    ).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()

    await userEvent.click(screen.getByRole("button", { name: "Liberar" }))

    // Zero é o sinal de "libera": o hook o traduz em DELETE.
    expect(onSave).toHaveBeenCalledWith(0)
  })

  it("desiste da liberação sem apagar nada", async () => {
    const { onSave } = montarAlocacao()

    await userEvent.click(screen.getByRole("button", { name: "Liberar o dia" }))
    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(screen.getByRole("button", { name: "Salvar" })).toBeInTheDocument()
    expect(onSave).not.toHaveBeenCalled()
  })

  // Não há o que liberar num dia que nunca foi alocado.
  it("não oferece liberar num dia livre", () => {
    montarAlocacao(dia({ allocatedHours: 0, allocated: false }))

    expect(screen.queryByRole("button", { name: "Liberar o dia" })).not.toBeInTheDocument()
  })

  it("trava o envio enquanto salva", () => {
    montarAlocacao(dia(), true)

    expect(screen.getByRole("button", { name: "Salvando..." })).toBeDisabled()
  })
})

describe("ResponsibilityModal", () => {
  function montar(member = MEMBRO) {
    const onSave = vi.fn()
    const onClose = vi.fn()

    renderWithProviders(
      <ResponsibilityModal
        member={member}
        isSaving={false}
        onClose={onClose}
        onSave={onSave}
      />,
    )

    return { onSave, onClose }
  }

  it("abre com a frente atual do integrante", () => {
    montar()

    expect(screen.getByLabelText("Frente na obra")).toHaveValue("Estrutura")
  })

  it("salva o texto aparado", async () => {
    const { onSave } = montar({ ...MEMBRO, userResponsibility: null })

    await userEvent.type(screen.getByLabelText("Frente na obra"), "  Instalações  ")
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(onSave).toHaveBeenCalledWith("Instalações")
  })

  // O limite não é `maxLength` no input: cortar o texto em silêncio esconde a
  // regra. Quem barra é o zod, com a mensagem no campo — o mesmo limite da
  // coluna `user_responsibility`.
  it("recusa acima de 100 caracteres", async () => {
    const { onSave } = montar({ ...MEMBRO, userResponsibility: null })

    const campo = screen.getByLabelText("Frente na obra")
    await userEvent.click(campo)
    await userEvent.paste("x".repeat(101))
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(await screen.findByRole("alert")).toHaveTextContent("Máximo de 100 caracteres")
    expect(onSave).not.toHaveBeenCalled()
  })

  it("aceita esvaziar o campo para limpar a frente", async () => {
    const { onSave } = montar()

    await userEvent.clear(screen.getByLabelText("Frente na obra"))
    await userEvent.click(screen.getByRole("button", { name: "Salvar" }))

    expect(onSave).toHaveBeenCalledWith("")
  })

  it("fecha sem salvar", async () => {
    const { onSave, onClose } = montar()

    await userEvent.click(screen.getByRole("button", { name: "Cancelar" }))

    expect(onClose).toHaveBeenCalled()
    expect(onSave).not.toHaveBeenCalled()
  })
})
