import { describe, expect, it } from "vitest"

import { RoleInProject } from "@/pages/obra-selecionada/types/equipes"
import { GlobalRole } from "@/shared/types/user"
import { WorkspaceRole } from "@/shared/types/workspace"

import {
  ACCESS,
  OBRA_MODULES,
  WORKSPACE_MODULES,
  accessTo,
  isObraModule,
  profileFromGlobalRole,
  profileFromProjectRole,
  profileFromWorkspaceRole,
  type AppModule,
  type Profile,
} from "../access"

/**
 * Esta matriz alimenta quatro coisas ao mesmo tempo (sidebar, ícone de
 * somente-leitura, aviso no header e guard de rota). Um teste por regra do
 * documento de Fluxos v2 §3 é o que impede que uma delas seja afrouxada sem
 * ninguém notar — afrouxar acesso não quebra tela nenhuma, só vaza.
 */

const PERFIS: Profile[] = ["engenheiro", "arquiteto", "cliente", "mestre"]

describe("ACCESS — integridade da matriz", () => {
  it("declara todos os módulos para todos os perfis", () => {
    const modulos = [...WORKSPACE_MODULES, ...OBRA_MODULES]

    for (const perfil of PERFIS) {
      for (const modulo of modulos) {
        expect(ACCESS[perfil], `${perfil} × ${modulo}`).toHaveProperty(modulo)
      }
    }
  })

  it("só usa os três níveis previstos", () => {
    for (const perfil of PERFIS) {
      for (const nivel of Object.values(ACCESS[perfil])) {
        expect(["w", "r", ""]).toContain(nivel)
      }
    }
  })

  it("não repete módulo entre os dois níveis de navegação", () => {
    const repetidos = WORKSPACE_MODULES.filter((m) =>
      (OBRA_MODULES as readonly string[]).includes(m),
    )

    expect(repetidos).toEqual([])
  })
})

describe("ACCESS — regras do documento", () => {
  it("dá escrita total ao engenheiro", () => {
    expect(Object.values(ACCESS.engenheiro).every((nivel) => nivel === "w")).toBe(true)
  })

  // O cliente é o perfil de risco: enxerga a obra, mas não escreve em nada
  // dentro dela. `home` e `obras` continuam "w" porque ali "escrever" é só
  // navegar — são as telas de entrada, não conteúdo da obra.
  it("não dá escrita ao cliente em nenhum módulo da obra", () => {
    for (const modulo of OBRA_MODULES) {
      expect(ACCESS.cliente[modulo], modulo).not.toBe("w")
    }
  })

  it("deixa o cliente acompanhar obra, etapas e orçamento em leitura", () => {
    expect(ACCESS.cliente["visao-geral"]).toBe("r")
    expect(ACCESS.cliente.orcamento).toBe("r")
    expect(ACCESS.cliente.etapas).toBe("r")
  })

  it("esconde tarefas, equipes e agenda do cliente", () => {
    expect(ACCESS.cliente.tarefas).toBe("")
    expect(ACCESS.cliente.equipes).toBe("")
    expect(ACCESS.cliente.agenda).toBe("")
  })

  it("reserva Pessoas ao engenheiro", () => {
    expect(ACCESS.engenheiro.pessoas).toBe("w")
    expect(ACCESS.arquiteto.pessoas).toBe("")
    expect(ACCESS.mestre.pessoas).toBe("")
    expect(ACCESS.cliente.pessoas).toBe("")
  })

  // Orçamento é dado sensível da construtora: quem não decide preço não vê.
  it("esconde orçamento de arquiteto e mestre", () => {
    expect(ACCESS.arquiteto.orcamento).toBe("")
    expect(ACCESS.mestre.orcamento).toBe("")
  })

  it("deixa mestre e arquiteto tocarem tarefas e diário", () => {
    for (const perfil of ["arquiteto", "mestre"] as const) {
      expect(ACCESS[perfil].tarefas).toBe("w")
      expect(ACCESS[perfil].diario).toBe("w")
    }
  })
})

describe("profileFromProjectRole", () => {
  it("mapeia cada papel de obra ao perfil do design", () => {
    expect(profileFromProjectRole(RoleInProject.OWNER)).toBe("engenheiro")
    expect(profileFromProjectRole(RoleInProject.ENGINEER)).toBe("engenheiro")
    expect(profileFromProjectRole(RoleInProject.ARCHITECT)).toBe("arquiteto")
    expect(profileFromProjectRole(RoleInProject.FOREMAN)).toBe("mestre")
    expect(profileFromProjectRole(RoleInProject.USER)).toBe("cliente")
  })

  // Sem vínculo com a obra não há perfil: o `null` é o que faz o chamador
  // cair no papel de workspace em vez de assumir algo.
  it("devolve null sem papel", () => {
    expect(profileFromProjectRole(null)).toBeNull()
    expect(profileFromProjectRole(undefined)).toBeNull()
  })
})

describe("profileFromGlobalRole", () => {
  it("mapeia cada papel global", () => {
    expect(profileFromGlobalRole(GlobalRole.ADMIN)).toBe("engenheiro")
    expect(profileFromGlobalRole(GlobalRole.ENG)).toBe("engenheiro")
    expect(profileFromGlobalRole(GlobalRole.ARQ)).toBe("arquiteto")
    expect(profileFromGlobalRole(GlobalRole.USER)).toBe("cliente")
  })

  // Fallback fechado: sem papel conhecido, o menos privilegiado.
  it("cai em cliente quando não há papel", () => {
    expect(profileFromGlobalRole(null)).toBe("cliente")
    expect(profileFromGlobalRole(undefined)).toBe("cliente")
  })
})

describe("profileFromWorkspaceRole", () => {
  it("trata OWNER e ADMIN da conta como engenheiro", () => {
    expect(profileFromWorkspaceRole(WorkspaceRole.OWNER)).toBe("engenheiro")
    expect(profileFromWorkspaceRole(WorkspaceRole.ADMIN)).toBe("engenheiro")
  })

  // MEMBER vira "mestre" para ganhar home/obras sem enxergar Pessoas — o
  // acesso real dele a cada obra vem do papel no projeto.
  it("trata MEMBER como mestre e CLIENT como cliente", () => {
    expect(profileFromWorkspaceRole(WorkspaceRole.MEMBER)).toBe("mestre")
    expect(profileFromWorkspaceRole(WorkspaceRole.CLIENT)).toBe("cliente")
  })

  it("devolve null sem papel", () => {
    expect(profileFromWorkspaceRole(null)).toBeNull()
    expect(profileFromWorkspaceRole(undefined)).toBeNull()
  })
})

describe("accessTo", () => {
  it("lê o nível da matriz", () => {
    expect(accessTo("engenheiro", "orcamento")).toBe("w")
    expect(accessTo("cliente", "orcamento")).toBe("r")
    expect(accessTo("mestre", "orcamento")).toBe("")
  })

  // Perfil nulo é usuário sem vínculo nenhum: nega tudo, nunca "r".
  it("nega tudo quando não há perfil", () => {
    for (const modulo of [...WORKSPACE_MODULES, ...OBRA_MODULES] as AppModule[]) {
      expect(accessTo(null, modulo)).toBe("")
    }
  })
})

describe("isObraModule", () => {
  it("reconhece os módulos de dentro da obra", () => {
    expect(isObraModule("etapas")).toBe(true)
    expect(isObraModule("orcamento")).toBe(true)
  })

  it("rejeita módulos de workspace e nomes desconhecidos", () => {
    expect(isObraModule("pessoas")).toBe(false)
    expect(isObraModule("home")).toBe(false)
    expect(isObraModule("modulo-inexistente")).toBe(false)
  })
})
