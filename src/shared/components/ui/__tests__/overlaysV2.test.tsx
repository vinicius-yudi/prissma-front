import { screen, waitFor } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { toast } from "react-toastify"
import { afterEach, describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { Drawer } from "../drawer/Drawer"
import { Fachada } from "../fachada/Fachada"
import { estimateFloors, fachadaGeometry, roofFor } from "../fachada/fachadaGeometry"
import { Modal } from "../modal/Modal"
import { ToastCloseButton } from "../toast/ToastCloseButton"
import { ToastIcon } from "../toast/ToastIcon"
import { ToastMessage } from "../toast/ToastMessage"
import { Toaster } from "../toast/Toaster"

afterEach(() => {
  toast.dismiss()
})

describe("<Drawer />", () => {
  it("não monta nada fechado", () => {
    renderWithProviders(
      <Drawer open={false} onClose={vi.fn()} label="Tarefa">
        <p>Detalhe</p>
      </Drawer>,
    )

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument()
  })

  it("fecha no Esc e no fundo", async () => {
    const onClose = vi.fn()
    renderWithProviders(
      <Drawer open onClose={onClose} label="Tarefa">
        <p>Detalhe</p>
      </Drawer>,
    )

    expect(screen.getByRole("dialog", { name: "Tarefa" })).toHaveFocus()
    await userEvent.keyboard("{Escape}")
    await userEvent.click(document.querySelector("[aria-hidden=true]") as HTMLElement)

    expect(onClose).toHaveBeenCalledTimes(2)
  })
})

describe("foco das camadas", () => {
  // Acessibilidade §13: o foco volta para quem abriu.
  it("devolve o foco para quem abriu o modal", async () => {
    const { rerender } = renderWithProviders(
      <>
        <button type="button">Abrir</button>
        <Modal open={false} onClose={vi.fn()} title="Nova obra" />
      </>,
    )
    screen.getByRole("button", { name: "Abrir" }).focus()

    rerender(
      <>
        <button type="button">Abrir</button>
        <Modal open onClose={vi.fn()} title="Nova obra" />
      </>,
    )
    expect(screen.getByRole("dialog")).toHaveFocus()

    rerender(
      <>
        <button type="button">Abrir</button>
        <Modal open={false} onClose={vi.fn()} title="Nova obra" />
      </>,
    )

    await waitFor(() => expect(screen.getByRole("button", { name: "Abrir" })).toHaveFocus())
  })

  it("mostra o rodapé de ações quando vem", () => {
    renderWithProviders(
      <Modal open onClose={vi.fn()} title="Lançar despesa" footer={<button type="button">Lançar</button>} />,
    )

    expect(screen.getByRole("button", { name: "Lançar" }).closest("footer")).toBeInTheDocument()
  })
})

describe("<Fachada />", () => {
  it("desenha previsto, executado e cota", () => {
    const { container } = renderWithProviders(<Fachada progress={39} seed={7} />)

    expect(container.querySelector("[data-planned]")).toBeInTheDocument()
    expect(container.querySelector("[data-built]")).toBeInTheDocument()
    expect(container.querySelector("[data-dims]")).toBeInTheDocument()
  })

  it("tira a cota nas miniaturas e aceita platibanda", () => {
    const { container } = renderWithProviders(<Fachada progress={150} roof="flat" floors={3} showDims={false} />)

    expect(container.querySelector("[data-dims]")).not.toBeInTheDocument()
  })

  // A mesma obra sempre tem o mesmo desenho.
  it("gera a mesma geometria para a mesma semente", () => {
    const a = fachadaGeometry({ floors: 2, roof: "gable", seed: 42, showDims: true })
    const b = fachadaGeometry({ floors: 2, roof: "gable", seed: 42, showDims: true })

    expect(a).toEqual(b)
  })

  it.each([
    [0, 100, 1],
    [120, 100, 2],
    [900, 100, 4],
    [100, 0, 1],
  ])("estima %i m² sobre %i m² de terreno em %i pavimento(s)", (built, land, floors) => {
    expect(estimateFloors(built, land)).toBe(floors)
  })

  it("escolhe o telhado pelo tipo de projeto", () => {
    expect(roofFor("RESIDENTIAL")).toBe("gable")
    expect(roofFor("COMMERCIAL")).toBe("flat")
    expect(roofFor(null)).toBe("flat")
  })
})

describe("toast", () => {
  it.each([
    ["success", ".lucide-check"],
    ["error", ".lucide-triangle-alert"],
    ["warning", ".lucide-triangle-alert"],
    ["info", ".lucide-info"],
    ["default", ".lucide-check"],
  ] as const)("usa o ícone certo para %s", (type, seletor) => {
    const { container } = renderWithProviders(<ToastIcon type={type} theme="light" />)

    expect(container.querySelector(seletor)).toBeInTheDocument()
  })

  it("dispensa pelo botão com nome acessível", async () => {
    const closeToast = vi.fn()
    renderWithProviders(<ToastCloseButton closeToast={closeToast} type="success" theme="light" ariaLabel="x" />)

    await userEvent.click(screen.getByRole("button", { name: "Dispensar" }))

    expect(closeToast).toHaveBeenCalled()
  })

  // Toda ação volta atrás: o Desfazer roda e fecha o toast.
  it("roda a ação e fecha o toast", async () => {
    const onUndo = vi.fn()
    const closeToast = vi.fn()
    renderWithProviders(
      <ToastMessage
        title="Tarefa movida para Concluída"
        body="Assentar revestimento"
        action={{ label: "Desfazer", onClick: onUndo }}
        closeToast={closeToast}
      />,
    )

    await userEvent.click(screen.getByRole("button", { name: "Desfazer" }))

    expect(onUndo).toHaveBeenCalled()
    expect(closeToast).toHaveBeenCalled()
    expect(screen.getByText("Assentar revestimento")).toBeInTheDocument()
  })

  it("mostra o toast disparado pelo app", async () => {
    renderWithProviders(<Toaster />)

    toast.success("Obra salva")

    expect(await screen.findByText("Obra salva")).toBeInTheDocument()
  })
})
