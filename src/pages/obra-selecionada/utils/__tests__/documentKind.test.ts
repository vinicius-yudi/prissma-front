import { describe, expect, it } from "vitest"

import { isAcceptedFile, kindOf } from "../documentKind"

const DOCX = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"

describe("kindOf", () => {
  it("lê o tipo pelo MIME", () => {
    expect(kindOf({ fileName: "a", fileType: "image/png" })).toBe("img")
    expect(kindOf({ fileName: "a", fileType: DOCX })).toBe("doc")
    expect(kindOf({ fileName: "a", fileType: "application/pdf" })).toBe("pdf")
  })

  it("cai na extensão quando o MIME vem vazio", () => {
    expect(kindOf({ fileName: "laje.JPG", fileType: "" })).toBe("img")
    expect(kindOf({ fileName: "contrato.docx", fileType: "" })).toBe("doc")
    expect(kindOf({ fileName: "semextensao", fileType: "" })).toBe("pdf")
  })
})

describe("isAcceptedFile", () => {
  it("aceita imagem, PDF e DOCX; recusa o resto", () => {
    expect(isAcceptedFile({ type: "image/webp", name: "a.webp" })).toBe(true)
    expect(isAcceptedFile({ type: "application/pdf", name: "a.pdf" })).toBe(true)
    expect(isAcceptedFile({ type: "", name: "a.docx" })).toBe(true)
    expect(isAcceptedFile({ type: "", name: "a.xlsx" })).toBe(false)
    expect(isAcceptedFile({ type: "text/plain", name: "a.pdf" })).toBe(false)
  })
})
