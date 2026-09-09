import { describe, expect, it } from "vitest"

import { ACCESS, OBRA_MODULES, WORKSPACE_MODULES } from "./access"
import { DEFERRED_WORKSPACE_NAV, OBRA_NAV, WORKSPACE_NAV } from "./nav"

/**
 * A sidebar é a interseção destas listas com a matriz de acesso. O que quebra
 * na prática é a lista e a matriz saírem de sincronia: item de menu que aponta
 * para módulo inexistente rende um 404, e módulo sem item some da navegação
 * sem ninguém perceber.
 */

describe("WORKSPACE_NAV", () => {
  it("só lista módulos que a matriz de acesso conhece", () => {
    for (const item of WORKSPACE_NAV) {
      expect(WORKSPACE_MODULES).toContain(item.module)
    }
  })

  // Nível 1 navega por caminho absoluto; relativo aqui levaria o usuário para
  // dentro da obra em que ele estivesse.
  it("usa caminhos absolutos", () => {
    for (const item of WORKSPACE_NAV) {
      expect(item.path.startsWith("/"), item.module).toBe(true)
    }
  })

  it("não repete módulo", () => {
    const modulos = WORKSPACE_NAV.map((item) => item.module)

    expect(new Set(modulos).size).toBe(modulos.length)
  })
})

describe("OBRA_NAV", () => {
  it("cobre todos os módulos de obra da matriz", () => {
    expect(OBRA_NAV.map((item) => item.module).sort()).toEqual([...OBRA_MODULES].sort())
  })

  // Nível 2 navega relativo à obra: uma barra no início tiraria o usuário do
  // contexto da obra selecionada.
  it("usa caminhos relativos", () => {
    for (const item of OBRA_NAV) {
      expect(item.path.startsWith("/"), item.module).toBe(false)
    }
  })
})

describe("itens adiados", () => {
  // Estes existem no design e na matriz, mas ainda não têm página. Ficam fora
  // da navegação ativa justamente para não render item que não abre.
  it("não aparecem na navegação ativa", () => {
    const ativos = WORKSPACE_NAV.map((item) => item.module)

    for (const item of DEFERRED_WORKSPACE_NAV) {
      expect(ativos).not.toContain(item.module)
    }
  })

  it("continuam declarados na matriz de acesso", () => {
    for (const item of DEFERRED_WORKSPACE_NAV) {
      expect(ACCESS.engenheiro).toHaveProperty(item.module)
    }
  })
})

describe("integridade dos itens", () => {
  it("cada item tem ícone e chave i18n do prefixo esperado", () => {
    for (const item of [...WORKSPACE_NAV, ...OBRA_NAV, ...DEFERRED_WORKSPACE_NAV]) {
      expect(item.icon, item.module).toBeTruthy()
      expect(item.labelKey, item.module).toMatch(/^sidebar\.nav\./)
    }
  })
})
