import { screen } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import { RoleInProject } from "@/pages/obra-selecionada/types/equipes"
import { renderWithProviders } from "@/test/renderWithProviders"

import { RoleChip } from "../RoleChip"

describe("<RoleChip />", () => {
  // O papel é POR OBRA: o mesmo usuário é dono de uma e arquiteto convidado em
  // outra. O chip responde "com que papel estou aqui".
  it.each([
    [RoleInProject.OWNER, "Proprietário"],
    [RoleInProject.ENGINEER, "Engenheiro"],
    [RoleInProject.ARCHITECT, "Arquiteto"],
    [RoleInProject.FOREMAN, "Mestre de obras"],
    [RoleInProject.USER, "Cliente"],
  ])("traduz o papel %s", (role, rotulo) => {
    renderWithProviders(<RoleChip role={role} />)

    expect(screen.getByText(rotulo)).toBeInTheDocument()
  })

  // O cartão de contexto da sidebar usa o mesmo chip com texto próprio.
  it("aceita rótulo próprio no lugar da tradução", () => {
    renderWithProviders(<RoleChip role={RoleInProject.OWNER} label="MINHA OBRA" />)

    expect(screen.getByText("MINHA OBRA")).toBeInTheDocument()
    expect(screen.queryByText("Proprietário")).not.toBeInTheDocument()
  })

  it("aceita classe extra de quem monta", () => {
    renderWithProviders(<RoleChip role={RoleInProject.ENGINEER} className="ml-2" />)

    expect(screen.getByText("Engenheiro")).toHaveClass("ml-2")
  })
})
