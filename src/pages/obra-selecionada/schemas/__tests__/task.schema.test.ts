import { describe, expect, it } from "vitest"

import { fieldError } from "@/test/zod"

import { taskSchema } from "../task.schema"

const tarefaValida = {
  title: "Concretar laje",
  description: "",
  priority: "HIGH" as const,
  status: "TODO" as const,
  stageId: 3,
  plannedStartDate: "2026-03-01",
  plannedEndDate: "2026-03-05",
  assigneeUserId: null,
}

describe("taskSchema", () => {
  it("aceita tarefa sem descrição e sem responsável, como o backend", () => {
    expect(taskSchema.safeParse(tarefaValida).success).toBe(true)
    expect(taskSchema.safeParse({ ...tarefaValida, assigneeUserId: 12 }).success).toBe(true)
  })

  it("exige título de verdade e etapa", () => {
    expect(fieldError(taskSchema, { ...tarefaValida, title: "   " }, "title")).toBe("obra.tarefas.validation.titleRequired")
    expect(fieldError(taskSchema, { ...tarefaValida, stageId: 0 }, "stageId")).toBe("obra.tarefas.validation.stageRequired")
  })

  it("aceita as três prioridades e os quatro status", () => {
    for (const priority of ["LOW", "MEDIUM", "HIGH"]) {
      expect(taskSchema.safeParse({ ...tarefaValida, priority }).success, priority).toBe(true)
    }
    for (const status of ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]) {
      expect(taskSchema.safeParse({ ...tarefaValida, status }).success, status).toBe(true)
    }
  })

  it("exige as datas e o prazo no início ou depois", () => {
    expect(fieldError(taskSchema, { ...tarefaValida, plannedStartDate: "" }, "plannedStartDate")).toBe(
      "obra.tarefas.validation.plannedStartDateRequired",
    )
    expect(fieldError(taskSchema, { ...tarefaValida, plannedEndDate: "2026-02-01" }, "plannedEndDate")).toBe(
      "obra.tarefas.validation.plannedEndDateBeforeStart",
    )
    expect(taskSchema.safeParse({ ...tarefaValida, plannedEndDate: tarefaValida.plannedStartDate }).success).toBe(true)
  })
})
