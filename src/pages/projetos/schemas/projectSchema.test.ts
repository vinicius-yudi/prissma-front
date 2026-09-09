import { describe, expect, it } from "vitest"

import {
  PROJECT_FORM_DEFAULTS,
  STEP1_FIELDS,
  STEP2_FIELDS,
  formatAddress,
  projectSchema,
} from "./projectSchema"

/**
 * O cadastro de obra é um modal de dois passos, e a divisão dos campos entre
 * eles não é cosmética: `STEP1_FIELDS`/`STEP2_FIELDS` é o que o `trigger()` do
 * react-hook-form valida antes de deixar avançar. Campo fora das duas listas
 * só é cobrado no submit final — o usuário volta do passo 2 sem entender por
 * quê.
 */

const valido = {
  title: "Residencial Aurora",
  projectType: "RESIDENCIAL",
  category: "NOVA",
  status: "PLANNING" as const,
  landArea: 300,
  builtArea: 180,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-12-01",
  cep: "01310100",
  logradouro: "Avenida Paulista",
  numero: "1000",
  complemento: "",
  bairro: "Bela Vista",
  cidade: "São Paulo",
  uf: "SP",
}

function erroDe(data: unknown, campo: string): string | undefined {
  const result = projectSchema.safeParse(data)
  if (result.success) return undefined
  return result.error.flatten().fieldErrors[campo]?.[0]
}

describe("projectSchema — dados da obra", () => {
  it("aceita uma obra completa", () => {
    expect(projectSchema.safeParse(valido).success).toBe(true)
  })

  it("exige título com pelo menos 3 caracteres", () => {
    expect(erroDe({ ...valido, title: "AB" }, "title")).toBe(
      "O título deve ter pelo menos 3 caracteres",
    )
  })

  it("exige tipo e categoria selecionados", () => {
    expect(erroDe({ ...valido, projectType: "" }, "projectType")).toBe("Selecione o tipo de projeto")
    expect(erroDe({ ...valido, category: "" }, "category")).toBe("Selecione a categoria")
  })

  it("aceita os cinco status de obra", () => {
    for (const status of ["PLANNING", "IN_PROGRESS", "PAUSED", "COMPLETED", "CANCELLED"]) {
      expect(projectSchema.safeParse({ ...valido, status }).success, status).toBe(true)
    }
  })

  it("rejeita status fora do enum", () => {
    expect(projectSchema.safeParse({ ...valido, status: "ARQUIVADA" }).success).toBe(false)
  })

  // Área zero passaria despercebida e viraria divisão por zero em qualquer
  // indicador por m².
  it("exige áreas maiores que zero", () => {
    expect(erroDe({ ...valido, landArea: 0 }, "landArea")).toBe("Área deve ser maior que zero")
    expect(erroDe({ ...valido, builtArea: -1 }, "builtArea")).toBe("Área deve ser maior que zero")
  })

  it("exige as duas datas", () => {
    expect(erroDe({ ...valido, plannedStartDate: "" }, "plannedStartDate")).toBe(
      "Data de início é obrigatória",
    )
    expect(erroDe({ ...valido, plannedEndDate: "" }, "plannedEndDate")).toBe(
      "Data de término é obrigatória",
    )
  })

  it("rejeita término anterior ao início", () => {
    expect(erroDe({ ...valido, plannedEndDate: "2026-01-01" }, "plannedEndDate")).toBe(
      "A data de término deve ser posterior à data de início",
    )
  })

  // Obra de um dia só não existe: o schema pede término POSTERIOR, não igual.
  it("rejeita término igual ao início", () => {
    expect(projectSchema.safeParse({ ...valido, plannedEndDate: valido.plannedStartDate }).success).toBe(
      false,
    )
  })
})

describe("projectSchema — endereço", () => {
  it("exige CEP com exatamente 8 dígitos", () => {
    expect(erroDe({ ...valido, cep: "0131010" }, "cep")).toBe("CEP deve ter 8 dígitos")
    expect(erroDe({ ...valido, cep: "01310-100" }, "cep")).toBe("CEP deve ter 8 dígitos")
  })

  it("exige UF com duas letras", () => {
    expect(erroDe({ ...valido, uf: "SPO" }, "uf")).toBe("UF inválida")
  })

  it("exige logradouro, número, bairro e cidade", () => {
    expect(erroDe({ ...valido, logradouro: "" }, "logradouro")).toBe("Logradouro obrigatório")
    expect(erroDe({ ...valido, numero: "" }, "numero")).toBe("Número obrigatório")
    expect(erroDe({ ...valido, bairro: "" }, "bairro")).toBe("Bairro obrigatório")
    expect(erroDe({ ...valido, cidade: "" }, "cidade")).toBe("Cidade obrigatória")
  })

  it("aceita endereço sem complemento", () => {
    const { complemento: _ignorado, ...semComplemento } = valido

    expect(projectSchema.safeParse(semComplemento).success).toBe(true)
  })
})

describe("divisão dos passos", () => {
  it("cobre todos os campos obrigatórios entre os dois passos", () => {
    const validados = new Set([...STEP1_FIELDS, ...STEP2_FIELDS])
    const obrigatorios = Object.keys(PROJECT_FORM_DEFAULTS).filter((c) => c !== "complemento")

    for (const campo of obrigatorios) {
      expect(validados.has(campo as keyof typeof PROJECT_FORM_DEFAULTS), campo).toBe(true)
    }
  })

  it("não repete campo entre os passos", () => {
    const repetidos = STEP1_FIELDS.filter((campo) => STEP2_FIELDS.includes(campo))

    expect(repetidos).toEqual([])
  })

  // Complemento é o único opcional; incluí-lo no `trigger` não quebraria nada,
  // mas deixá-lo de fora documenta que ele é opcional de propósito.
  it("deixa o complemento fora da validação por passo", () => {
    expect([...STEP1_FIELDS, ...STEP2_FIELDS]).not.toContain("complemento")
  })
})

describe("formatAddress", () => {
  it("monta o endereço com o CEP pontuado", () => {
    expect(formatAddress(valido)).toBe(
      "Avenida Paulista, 1000 - Bela Vista, São Paulo - SP, 01310-100",
    )
  })

  it("insere o complemento depois do número quando ele existe", () => {
    expect(formatAddress({ ...valido, complemento: "Bloco B" })).toContain("1000, Bloco B - Bela Vista")
  })

  it("ignora complemento em branco", () => {
    expect(formatAddress({ ...valido, complemento: "   " })).toBe(formatAddress(valido))
  })

  it("apara os espaços do complemento", () => {
    expect(formatAddress({ ...valido, complemento: "  Bloco B  " })).toContain(", Bloco B -")
  })
})
