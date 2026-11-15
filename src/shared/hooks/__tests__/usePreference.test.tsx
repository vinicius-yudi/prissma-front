import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { deletePreference, getPreference, PreferenceKeys, putPreference } from "@/shared/services/preferences.service"

import { usePreference } from "../usePreference"

vi.mock("@/shared/services/preferences.service", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/services/preferences.service")>()),
  getPreference: vi.fn(),
  putPreference: vi.fn(),
  deletePreference: vi.fn(),
}))

const get = vi.mocked(getPreference)
const put = vi.mocked(putPreference)
const del = vi.mocked(deletePreference)

const KEY = PreferenceKeys.PROJECT_OVERVIEW_LAYOUT

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  return ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe("usePreference", () => {
  it("devolve null quando o usuário nunca salvou", async () => {
    get.mockResolvedValue(null)

    const { result } = renderHook(() => usePreference<{ n: number }>(KEY), { wrapper: wrapper() })

    await waitFor(() => expect(result.current.isLoading).toBe(false))
    await waitFor(() => expect(result.current.value).toBeNull())
    expect(get).toHaveBeenCalledWith(KEY)
  })

  it("salva com atualização otimista e fica com o que o servidor devolveu", async () => {
    get.mockResolvedValue({ key: KEY, value: { n: 1 }, updatedAt: "2026-01-01T00:00:00Z" })
    let resolvePut: (v: { key: string; value: { n: number }; updatedAt: string }) => void = () => {}
    put.mockReturnValue(new Promise((resolve) => (resolvePut = resolve)))

    const { result } = renderHook(() => usePreference<{ n: number }>(KEY), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.value).toEqual({ n: 1 }))

    let saving: Promise<void> = Promise.resolve()
    act(() => {
      saving = result.current.save({ n: 2 })
    })
    await waitFor(() => expect(result.current.value).toEqual({ n: 2 }))
    expect(put).toHaveBeenCalledWith(KEY, { n: 2 })

    await act(async () => {
      resolvePut({ key: KEY, value: { n: 2 }, updatedAt: "2026-02-01T00:00:00Z" })
      await saving
    })
    expect(result.current.value).toEqual({ n: 2 })
  })

  it("volta ao valor anterior e rejeita quando o servidor recusa", async () => {
    get.mockResolvedValue({ key: KEY, value: { n: 1 }, updatedAt: "2026-01-01T00:00:00Z" })
    put.mockRejectedValue(new Error("Layout inválido"))

    const { result } = renderHook(() => usePreference<{ n: number }>(KEY), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.value).toEqual({ n: 1 }))

    await act(async () => {
      await expect(result.current.save({ n: 9 })).rejects.toThrow("Layout inválido")
    })
    expect(result.current.value).toEqual({ n: 1 })
  })

  it("reset apaga no servidor e volta a null", async () => {
    get.mockResolvedValue({ key: KEY, value: { n: 1 }, updatedAt: "2026-01-01T00:00:00Z" })
    del.mockResolvedValue(undefined)

    const { result } = renderHook(() => usePreference<{ n: number }>(KEY), { wrapper: wrapper() })
    await waitFor(() => expect(result.current.value).toEqual({ n: 1 }))

    await act(async () => {
      await result.current.reset()
    })
    expect(del).toHaveBeenCalledWith(KEY)
    await waitFor(() => expect(result.current.value).toBeNull())
  })
})
