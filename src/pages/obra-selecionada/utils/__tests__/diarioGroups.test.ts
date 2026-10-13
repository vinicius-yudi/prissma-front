import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import type { DiarioEntry } from "../../types/diario"
import { groupByDay, nowForInput, relativeDay } from "../diarioGroups"

function entrada(id: number, entryDate: string): DiarioEntry {
  return {
    id,
    constructionProjectId: 7,
    entryDate,
    entryType: "OCCURRENCE",
    responsibleUserId: 1,
    responsibleName: "Ana",
    description: "x",
    attachmentId: null,
    createdAt: entryDate,
    updatedAt: entryDate,
  }
}

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date(2026, 8, 27, 15, 30))
})

afterEach(() => {
  vi.useRealTimers()
})

describe("groupByDay", () => {
  it("junta os registros do mesmo dia local, mais recentes primeiro", () => {
    const dias = groupByDay([
      entrada(1, new Date(2026, 8, 25, 8).toISOString()),
      entrada(2, new Date(2026, 8, 27, 9).toISOString()),
      entrada(3, new Date(2026, 8, 27, 14).toISOString()),
    ])
    expect(dias.map((d) => d.key)).toEqual(["2026-09-27", "2026-09-25"])
    expect(dias[0].entries.map((e) => e.id)).toEqual([3, 2])
  })
})

describe("relativeDay", () => {
  it("diz hoje, ontem ou nada", () => {
    expect(relativeDay(new Date(2026, 8, 27, 1))).toBe("today")
    expect(relativeDay(new Date(2026, 8, 26, 23))).toBe("yesterday")
    expect(relativeDay(new Date(2026, 8, 20))).toBeNull()
  })
})

describe("nowForInput", () => {
  it("devolve a hora local no formato do datetime-local", () => {
    expect(nowForInput()).toBe("2026-09-27T15:30")
  })
})
