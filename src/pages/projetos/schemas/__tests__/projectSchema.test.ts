import { describe, expect, it } from "vitest"

import { fieldError } from "@/test/zod"

import {
  PROJECT_FORM_DEFAULTS,
  STEP1_FIELDS,
  STEP2_FIELDS,
  formatAddress,
  projectSchema,
} from "../projectSchema"

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


describe("projectSchema — dados da obra", () => {
  it("aceita uma obra completa", () => {
    expect(projectSchema.safeParse(valido).success).toBe(true)
  })

  it("exige título com pelo menos 3 caracteres", () => {
    expect(fieldError(projectSchema, { ...valido, title: "AB" }, "title")).toBe(
      "validation.project.titleMin",
    )
  })

  it("exige tipo e categoria selecionados", () => {
    expect(fieldError(projectSchema, { ...valido, projectType: "" }, "projectType")).toBe("validation.project.typeRequired")
    expect(fieldError(projectSchema, { ...valido, category: "" }, "category")).toBe("validation.project.categoryRequired")
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
    expect(fieldError(projectSchema, { ...valido, landArea: 0 }, "landArea")).toBe("validation.project.areaPositive")
    expect(fieldError(projectSchema, { ...valido, builtArea: -1 }, "builtArea")).toBe("validation.project.areaPositive")
  })

  it("exige as duas datas", () => {
    expect(fieldError(projectSchema, { ...valido, plannedStartDate: "" }, "plannedStartDate")).toBe(
      "validation.project.startRequired",
    )
    expect(fieldError(projectSchema, { ...valido, plannedEndDate: "" }, "plannedEndDate")).toBe(
      "validation.project.endRequired",
    )
  })

  it("rejeita término anterior ao início", () => {
    expect(fieldError(projectSchema, { ...valido, plannedEndDate: "2026-01-01" }, "plannedEndDate")).toBe(
      "validation.project.endAfterStart",
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
    expect(fieldError(projectSchema, { ...valido, cep: "0131010" }, "cep")).toBe("validation.project.cepLength")
    expect(fieldError(projectSchema, { ...valido, cep: "01310-100" }, "cep")).toBe("validation.project.cepLength")
  })

  it("exige UF com duas letras", () => {
    expect(fieldError(projectSchema, { ...valido, uf: "SPO" }, "uf")).toBe("validation.project.stateInvalid")
  })

  it("exige logradouro, número, bairro e cidade", () => {
    expect(fieldError(projectSchema, { ...valido, logradouro: "" }, "logradouro")).toBe("validation.project.streetRequired")
    expect(fieldError(projectSchema, { ...valido, numero: "" }, "numero")).toBe("validation.project.numberRequired")
    expect(fieldError(projectSchema, { ...valido, bairro: "" }, "bairro")).toBe("validation.project.districtRequired")
    expect(fieldError(projectSchema, { ...valido, cidade: "" }, "cidade")).toBe("validation.project.cityRequired")
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
