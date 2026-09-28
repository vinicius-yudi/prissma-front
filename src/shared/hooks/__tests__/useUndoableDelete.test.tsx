import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { act, renderHook, waitFor } from "@testing-library/react"
import type { ReactElement, ReactNode } from "react"
import { toast } from "react-toastify"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { UNDO_WINDOW_MS, useUndoableDelete } from "../useUndoableDelete"

vi.mock("react-toastify", () => ({ toast: { success: vi.fn(), error: vi.fn() } }))

interface Item {
  id: number
  name: string
}

const KEY = ["itens"]

function setup(commit = vi.fn(async () => undefined)) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false }, mutations: { retry: false } } })
  client.setQueryData<Item[]>(KEY, [{ id: 1, name: "A" }, { id: 2, name: "B" }])
  const wrapper = ({ children }: { children: ReactNode }) => <QueryClientProvider client={client}>{children}</QueryClientProvider>
  const { result } = renderHook(
    () =>
      useUndoableDelete<Item, Item[]>({
        queryKey: () => KEY,
        removeFrom: (list, item) => list.filter((x) => x.id !== item.id),
        commit,
        alsoInvalidate: () => [["totais"]],
        describe: (item) => ({ title: "Excluído", body: item.name }),
        errorMessage: "Falhou",
      }),
    { wrapper },
  )
  return { client, remove: result.current, commit }
}

function acaoDoToast() {
  const calls = vi.mocked(toast.success).mock.calls
  return (calls[calls.length - 1][0] as ReactElement<{ action: { onClick: () => void } }>).props.action
}

beforeEach(() => {
  vi.useFakeTimers({ shouldAdvanceTime: true })
  vi.mocked(toast.success).mockClear()
  vi.mocked(toast.error).mockClear()
})

afterEach(() => {
  vi.useRealTimers()
})

describe("useUndoableDelete", () => {
  it("tira da tela na hora e só exclui quando a janela fecha", async () => {
    const { client, remove, commit } = setup()

    act(() => remove({ id: 1, name: "A" }))

    expect(client.getQueryData<Item[]>(KEY)).toEqual([{ id: 2, name: "B" }])
    expect(commit).not.toHaveBeenCalled()
    expect(toast.success).toHaveBeenCalledWith(expect.anything(), { autoClose: UNDO_WINDOW_MS })

    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))
    await waitFor(() => expect(commit).toHaveBeenCalledWith({ id: 1, name: "A" }, expect.anything()))
  })

  it("desfazer devolve o item e não chama o servidor", () => {
    const { client, remove, commit } = setup()

    act(() => remove({ id: 1, name: "A" }))
    act(() => acaoDoToast().onClick())
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS * 2))

    expect(client.getQueryData<Item[]>(KEY)).toHaveLength(2)
    expect(commit).not.toHaveBeenCalled()
  })

  it("avisa quando a exclusão falha", async () => {
    const { remove } = setup(vi.fn(async () => Promise.reject(new Error(""))))

    act(() => remove({ id: 1, name: "A" }))
    act(() => vi.advanceTimersByTime(UNDO_WINDOW_MS))

    await waitFor(() => expect(toast.error).toHaveBeenCalledWith("Falhou"))
  })

  it("funciona sem nada no cache", async () => {
    const { client, remove, commit } = setup()
    client.removeQueries({ queryKey: KEY })

    act(() => remove({ id: 1, name: "A" }))
    act(() => acaoDoToast().onClick())

    expect(client.getQueryData(KEY)).toBeUndefined()
    expect(commit).not.toHaveBeenCalled()
  })
})
