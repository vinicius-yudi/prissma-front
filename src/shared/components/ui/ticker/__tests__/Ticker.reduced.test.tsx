import { screen } from "@testing-library/react"
import { describe, expect, it, vi } from "vitest"

import { renderWithProviders } from "@/test/renderWithProviders"

import { Ticker } from "../Ticker"

vi.mock("motion/react", async (importOriginal) => ({
  ...(await importOriginal<typeof import("motion/react")>()),
  useReducedMotion: () => true,
}))

describe("<Ticker /> com movimento reduzido", () => {
  // DS: com movimento reduzido toda informação continua presente, sem contagem.
  it("mostra o valor final direto", () => {
    renderWithProviders(<Ticker value={7} />)

    expect(screen.getByText("7")).toBeInTheDocument()
  })
})
