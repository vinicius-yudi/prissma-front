import { beforeEach, describe, expect, it, vi } from "vitest"

import { api } from "@/lib/api"
import type { Notification } from "@/shared/types/notification"

import { markNotificationAsRead } from "../notification.service"

vi.mock("@/lib/api", () => ({
  api: { get: vi.fn(), patch: vi.fn() },
}))

const patch = vi.mocked(api.patch)

beforeEach(() => {
  vi.resetAllMocks()
})

describe("markNotificationAsRead", () => {
  it("marca uma notificação do usuário atual como lida", async () => {
    const response: Notification = {
      id: 42,
      type: "TASK_ASSIGNED",
      title: "Tarefa atribuída",
      message: "Revisar o cronograma.",
      read: true,
      createdAt: "2026-10-13T12:00:00Z",
    }
    patch.mockResolvedValue(response)

    await expect(markNotificationAsRead(42)).resolves.toEqual(response)

    expect(patch).toHaveBeenCalledExactlyOnceWith("/users/me/notifications/42/read")
  })
})