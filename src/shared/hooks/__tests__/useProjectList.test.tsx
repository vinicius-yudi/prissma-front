import { renderHook, waitFor } from "@testing-library/react"
import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import type { Project } from "@/shared/types/project"

import { useProjectList } from "../useProjectList"

vi.mock("@/pages/projetos/services/projects.service", () => ({
  listProjects: vi.fn(async () => [{ id: 1, title: "Residência Mercês" }] as Project[]),
}))

function wrapper({ children }: { children: ReactNode }) {
  return <QueryClientProvider client={new QueryClient()}>{children}</QueryClientProvider>
}

describe("useProjectList", () => {
  // Enquanto carrega, lista vazia — o shell nunca recebe undefined.
  it("começa vazia e entrega as obras quando chegam", async () => {
    const { result } = renderHook(() => useProjectList(), { wrapper })

    expect(result.current).toEqual([])
    await waitFor(() => expect(result.current).toHaveLength(1))
  })
})
