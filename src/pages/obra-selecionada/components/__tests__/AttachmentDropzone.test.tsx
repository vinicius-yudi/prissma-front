import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { AttachmentDropzone } from "../AttachmentDropzone"

/** A dropzone compacta das Propostas (a de Documentos é <DocumentsDropzone>). */

function entrada(): HTMLInputElement {
  return document.querySelector('input[type="file"]') as HTMLInputElement
}

describe("<AttachmentDropzone />", () => {
  const onFile = vi.fn()
  const props = { accept: "application/pdf", acceptLabel: "PDF · DOCX", maxSizeMb: 50, onFile }

  it("mostra os tipos aceitos e o limite de tamanho", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)

    expect(screen.getByText(/PDF · DOCX/)).toBeInTheDocument()
    expect(screen.getByText(/50 MB/)).toBeInTheDocument()
  })

  it("entrega o arquivo escolhido pelo seletor", async () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)
    const file = new File(["conteudo"], "planta.pdf", { type: "application/pdf" })

    await userEvent.upload(entrada(), file)

    expect(onFile).toHaveBeenCalledWith(file)
  })

  // §13: o alvo de clique não é <button>, então precisa responder ao teclado.
  it.each(["{Enter}", " "])("abre o seletor com a tecla %s", async (tecla) => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)
    const clique = vi.spyOn(entrada(), "click")

    screen.getByRole("button", { name: /Arraste arquivos/ }).focus()
    await userEvent.keyboard(tecla)

    expect(clique).toHaveBeenCalled()
  })

  // O upload usa `fetch`, que não reporta progresso: nada de percentual inventado.
  it("mostra o aviso de envio sem prometer percentual", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading />)

    expect(screen.getByText("Enviando arquivos")).toBeInTheDocument()
    expect(screen.queryByText(/%/)).not.toBeInTheDocument()
  })

  it("não mostra a barra fora do envio", () => {
    renderWithProviders(<AttachmentDropzone {...props} isUploading={false} />)

    expect(screen.queryByText("Enviando arquivos")).not.toBeInTheDocument()
  })
})
