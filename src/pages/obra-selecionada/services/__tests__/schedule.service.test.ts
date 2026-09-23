import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"

import { ScheduleView } from "../../types/schedule"
import {
  deleteAllocation,
  getSchedule,
  updateResponsibility,
  upsertAllocation,
} from "../schedule.service"

/**
 * O que quebra aqui é sempre a URL: alocação e responsabilidade são rotas
 * aninhadas em `members/{userId}`, e a data vai no PATH, não no corpo. Um erro
 * de montagem escreve no dia errado sem nenhum sintoma visível.
 */
vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), post: vi.fn(), patch: vi.fn(), put: vi.fn(), delete: vi.fn() },
}))

const get = vi.mocked(api.get)
const put = vi.mocked(api.put)
const del = vi.mocked(api.delete)

beforeEach(() => {
  vi.resetAllMocks()
})

describe("getSchedule", () => {
  it("monta a query com view e data de referência", async () => {
    await getSchedule(7, { view: ScheduleView.WEEK, date: "2026-08-12" })

    expect(get).toHaveBeenCalledWith("/projects/7/schedule?view=WEEK&date=2026-08-12")
  })

  // Sem data o servidor assume hoje. Um `?date=` vazio não é "sem data": é
  // string em branco, e o backend responde 400.
  it("omite a data quando não há referência", async () => {
    await getSchedule(7, { view: ScheduleView.MONTH })

    expect(get).toHaveBeenCalledWith("/projects/7/schedule?view=MONTH")
  })

  it("propaga o erro do backend com a mensagem do servidor", async () => {
    get.mockRejectedValue(new Error("View must be WEEK or MONTH"))

    await expect(getSchedule(7, { view: ScheduleView.WEEK })).rejects.toThrow(
      "View must be WEEK or MONTH",
    )
  })
})

describe("upsertAllocation", () => {
  it("usa a data no path e as horas no corpo", async () => {
    await upsertAllocation({ projectId: 7, userId: 10, date: "2026-08-10", allocatedHours: 8 })

    expect(put).toHaveBeenCalledWith("/projects/7/schedule/members/10/allocations/2026-08-10", {
      allocatedHours: 8,
    })
  })
})

describe("deleteAllocation", () => {
  it("chama o DELETE do dia", async () => {
    del.mockResolvedValue(undefined)

    await expect(
      deleteAllocation({ projectId: 7, userId: 10, date: "2026-08-10" }),
    ).resolves.toBeUndefined()
    expect(del).toHaveBeenCalledWith("/projects/7/schedule/members/10/allocations/2026-08-10")
  })
})

describe("updateResponsibility", () => {
  it("envia a frente de trabalho do integrante", async () => {
    await updateResponsibility({ projectId: 7, userId: 11, userResponsibility: "Instalações" })

    expect(put).toHaveBeenCalledWith("/projects/7/schedule/members/11/responsibility", {
      userResponsibility: "Instalações",
    })
  })

  it("aceita null para limpar a frente", async () => {
    await updateResponsibility({ projectId: 7, userId: 11, userResponsibility: null })

    expect(put).toHaveBeenCalledWith("/projects/7/schedule/members/11/responsibility", {
      userResponsibility: null,
    })
  })
})
