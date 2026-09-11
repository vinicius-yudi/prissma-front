import { act, renderHook, waitFor } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { createHookWrapper } from "@/test/renderWithProviders"

import {
  ProposalRequestError,
  getPreview,
  requestPreview,
} from "../../services/propostas.service"
import type { PreviewJob, PreviewOptions, PreviewStatus } from "../../types/proposal"
import { POLL_INTERVAL_MS, usePreviaIA } from "../usePreviaIA"

vi.mock("../../services/propostas.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("../../services/propostas.service")>()),
  requestPreview: vi.fn(),
  getPreview: vi.fn(),
}))
vi.mock("react-toastify", () => ({
  toast: { success: vi.fn(), error: vi.fn(), warning: vi.fn(), info: vi.fn() },
}))

const { toast } = await import("react-toastify")
const disparar = vi.mocked(requestPreview)
const consultar = vi.mocked(getPreview)

const OPCOES: PreviewOptions = {
  environment: "LIVING_ROOM",
  style: "MODERN",
  colors: ["OFF_WHITE"],
  lighting: "WARM_INDIRECT",
  flooring: "LIGHT_PORCELAIN",
  generationMode: "PREVIEW",
}

function job(status: PreviewStatus, over: Partial<PreviewJob> = {}): PreviewJob {
  return {
    id: 9,
    proposalId: 3,
    status,
    versionId: status === "READY" ? 11 : null,
    errorMessage: null,
    createdAt: "2026-03-01T00:00:00Z",
    completedAt: status === "PROCESSING" ? null : "2026-03-01T00:00:40Z",
    ...over,
  }
}

function imagem(): File {
  return new File(["x"], "sala.png", { type: "image/png" })
}

function render() {
  return renderHook(() => usePreviaIA(7), { wrapper: createHookWrapper() })
}

async function iniciar(result: { current: ReturnType<typeof usePreviaIA> }) {
  act(() =>
    result.current.start({ proposalId: 3, rawImage: imagem(), floorPlan: null, options: OPCOES }),
  )
  await waitFor(() => expect(disparar).toHaveBeenCalled())
}

beforeEach(() => {
  vi.resetAllMocks()
  disparar.mockResolvedValue(job("PROCESSING"))
  consultar.mockResolvedValue(job("PROCESSING"))
})

describe("usePreviaIA", () => {
  it("não consulta nada antes do disparo", () => {
    render()

    expect(consultar).not.toHaveBeenCalled()
  })

  it("passa a acompanhar o job devolvido pelo 202", async () => {
    const { result } = render()

    await iniciar(result)

    expect(disparar).toHaveBeenCalledWith(7, 3, expect.any(File), null, OPCOES)
    await waitFor(() => expect(consultar).toHaveBeenCalledWith(7, 3, 9))
    await waitFor(() => expect(result.current.isProcessing).toBe(true))
    expect(result.current.activeProposalId).toBe(3)
  })

  it("anuncia a prévia pronta uma vez só", async () => {
    consultar.mockResolvedValue(job("READY"))
    const { result } = render()

    await iniciar(result)

    await waitFor(() => expect(toast.success).toHaveBeenCalledTimes(1))
    expect(result.current.isProcessing).toBe(false)
    expect(result.current.preview?.versionId).toBe(11)

    // O polling continua entregando o mesmo dado READY até a query parar — o
    // toast não pode sair de novo a cada entrega.
    await act(async () => {
      await result.current.preview
    })
    expect(toast.success).toHaveBeenCalledTimes(1)
  })

  it("mostra a mensagem do servidor quando a IA falha", async () => {
    consultar.mockResolvedValue(
      job("FAILED", { errorMessage: "A OpenAI recusou a imagem de entrada." }),
    )
    const { result } = render()

    await iniciar(result)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("A OpenAI recusou a imagem de entrada."),
    )
    expect(result.current.isFailed).toBe(true)
    expect(result.current.errorMessage).toBe("A OpenAI recusou a imagem de entrada.")
  })

  it("traduz o 415 do disparo em vez de repassar o texto do servidor", async () => {
    disparar.mockRejectedValue(new ProposalRequestError(415, "Unsupported Media Type"))
    const { result } = render()

    await iniciar(result)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith(
        "Tipo de arquivo não suportado. Envie PNG, JPG ou WEBP.",
      ),
    )
    expect(consultar).not.toHaveBeenCalled()
  })

  it("solta o job no reset", async () => {
    consultar.mockResolvedValue(job("READY"))
    const { result } = render()
    await iniciar(result)
    await waitFor(() => expect(result.current.preview).not.toBeNull())

    act(() => result.current.reset())

    await waitFor(() => expect(result.current.preview).toBeNull())
    expect(result.current.activeProposalId).toBeNull()
  })

  it("mantém o intervalo de polling que a tela espera", () => {
    expect(POLL_INTERVAL_MS).toBe(3000)
  })
})

describe("falhas sem mensagem", () => {
  it("cai no texto padrão quando o disparo falha sem mensagem", async () => {
    disparar.mockRejectedValue(new Error(""))
    const { result } = render()

    await iniciar(result)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("A geração da prévia falhou."),
    )
  })

  it("cai no texto padrão quando a IA falha sem detalhar o motivo", async () => {
    consultar.mockResolvedValue(job("FAILED"))
    const { result } = render()

    await iniciar(result)

    await waitFor(() =>
      expect(toast.error).toHaveBeenCalledWith("A geração da prévia falhou."),
    )
  })
})
