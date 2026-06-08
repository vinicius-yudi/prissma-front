import { useState, useMemo, useEffect } from "react"
import { useTarefasByProject } from "../hooks/useTarefasByProject"
import type { TarefaStatus, TarefaPriority, Tarefa } from "../types/tarefas"
import { Button } from "@/shared/components/ui/button/Button"
import { Modal } from "@/shared/components/ui/modal/Modal"
import { Loader, Pencil, Trash2, Plus, Search, Check } from "lucide-react"
import { useMutation, useQueryClient } from "@tanstack/react-query"
import { deleteTarefa } from "../services/tarefas.service"
import { TaskFormModal } from "./TaskFormModal"

interface TarefasTabProps {
  projectId: number
}

// As classes `.input`/`.glass-card` não existem no CSS do projeto; campos do
// filtro precisam das classes de token explícitas (fundo/borda/padding/foco).
const FILTER_FIELD_CLASS =
  "w-full bg-surface-container text-on-surface text-sm rounded-lg border border-outline-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all h-9 px-3"
const FILTER_SEARCH_CLASS =
  "w-full bg-surface-container text-on-surface placeholder:text-on-surface-variant text-sm rounded-lg border border-outline-variant outline-none focus:border-primary focus:ring-2 focus:ring-primary/30 transition-all pl-8 pr-3 py-1.5"

function getPriorityDisplay(priority: TarefaPriority): string {
  const priorityMap: Record<TarefaPriority, string> = {
    LOW: "Baixa",
    MEDIUM: "Média",
    HIGH: "Alta",
  }
  return priorityMap[priority] || priority
}

function getStatusDisplay(status: TarefaStatus) {
  const statusConfig: Record<TarefaStatus, { label: string; bgColor: string; textColor: string; borderColor: string; icon?: React.ReactNode; pulse?: boolean }> = {
    TODO: {
      label: "Pendente",
      bgColor: "bg-surface-container-highest",
      textColor: "text-on-surface-variant",
      borderColor: "border-outline-variant/30",
    },
    IN_PROGRESS: {
      label: "Em Andamento",
      bgColor: "bg-secondary-container/20",
      textColor: "text-secondary",
      borderColor: "border-secondary/20",
      pulse: true,
    },
    DONE: {
      label: "Concluída",
      bgColor: "bg-primary-container/20",
      textColor: "text-primary",
      borderColor: "border-primary/20",
      icon: <Check className="w-4 h-4" />,
    },
    BLOCKED: {
      label: "Bloqueada",
      bgColor: "bg-error-container/20",
      textColor: "text-error",
      borderColor: "border-error/20",
    },
  }

  return statusConfig[status] || statusConfig.TODO
}

function formatDate(date: string): string {
  try {
    const d = new Date(date)
    return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`
  } catch {
    return date
  }
}

function getRowOpacity(status: TarefaStatus): string {
  return status === "DONE" ? "opacity-60" : ""
}

function getTitleDecoration(status: TarefaStatus): string {
  return status === "DONE" ? "line-through" : ""
}

export function TarefasTab({ projectId }: TarefasTabProps) {
  const { stages, isLoading, refetch } = useTarefasByProject(projectId)
  const [filterMap, setFilterMap] = useState({} as Record<number, string>)
  const [selectedFilterType, setSelectedFilterType] = useState({} as Record<number, "NONE" | "STATUS" | "PRIORITY" | "ASSIGNEE">)
  const [selectedFilterValue, setSelectedFilterValue] = useState({} as Record<number, string>)
  const [selectedSortOrder, setSelectedSortOrder] = useState({} as Record<number, "ALPHABETICAL" | "START_DATE" | "END_DATE">)
  const [openFilterDropdown, setOpenFilterDropdown] = useState<number | null>(null)
  const [openSortDropdown, setOpenSortDropdown] = useState<number | null>(null)

  const [openStageForCreate, setOpenStageForCreate] = useState<number | null>(null)
  const [tarefaToDelete, setTarefaToDelete] = useState<{ stageId: number; id: number; title: string } | null>(null)
  const [selectedTask, setSelectedTask] = useState<{ stageId: number; tarefa: Tarefa } | null>(null)
  const [editingTask, setEditingTask] = useState<{ stageId: number; tarefa: Tarefa } | null>(null)
  const queryClient = useQueryClient()

  useEffect(() => {
    function handleClickOutside() {
      setOpenFilterDropdown(null)
      setOpenSortDropdown(null)
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const deleteMutation = useMutation({
    mutationFn: ({ stageId, id }: { stageId: number; id: number }) => deleteTarefa(stageId, id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["tarefas"] })
      refetch()
      closeDeleteModal()
    },
  })

  function openDeleteModal(stageId: number, id: number, title: string) {
    setTarefaToDelete({ stageId, id, title })
  }

  function closeDeleteModal() {
    setTarefaToDelete(null)
  }

  function handleConfirmDelete() {
    if (tarefaToDelete) {
      deleteMutation.mutate({ stageId: tarefaToDelete.stageId, id: tarefaToDelete.id })
    }
  }

  const filteredStages = useMemo(() => {
    return stages.map((s) => {
      const searchQuery = (filterMap[s.stage.id] ?? "").toLowerCase()
      const filterType = selectedFilterType[s.stage.id] ?? "NONE"
      const filterValue = selectedFilterValue[s.stage.id] ?? ""
      const sortOrder = selectedSortOrder[s.stage.id] ?? "ALPHABETICAL"

      const bySearch = searchQuery
        ? s.tasks.filter((t: Tarefa) =>
            Object.values(t).some((v) => String(v ?? "").toLowerCase().includes(searchQuery))
          )
        : s.tasks

      const byFilter = filterType === "NONE" || !filterValue
        ? bySearch
        : bySearch.filter((t: Tarefa) => {
            const normalized = String(filterValue).toLowerCase()
            if (filterType === "STATUS") return String(t.status).toLowerCase() === normalized
            if (filterType === "PRIORITY") return String(t.priority).toLowerCase() === normalized
            if (filterType === "ASSIGNEE") return String(t.assigneeName ?? "").toLowerCase() === normalized
            return true
          })

      const sorted = [...byFilter].sort((a: Tarefa, b: Tarefa) => {
        if (sortOrder === "ALPHABETICAL") {
          return String(a.title).localeCompare(String(b.title), "pt-BR", { sensitivity: "base" })
        }
        if (sortOrder === "START_DATE") {
          return String(a.plannedStartDate).localeCompare(String(b.plannedStartDate))
        }
        if (sortOrder === "END_DATE") {
          return String(a.plannedEndDate).localeCompare(String(b.plannedEndDate))
        }
        return 0
      })

      return {
        ...s,
        tasks: sorted,
      }
    })
  }, [stages, filterMap, selectedFilterType, selectedFilterValue, selectedSortOrder])

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader className="animate-spin" size={24} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {filteredStages.map(({ stage, tasks }) => (
        <div key={stage.id} className="glass-card rounded-xl overflow-hidden border border-outline-variant/20">
          <div className="px-6 py-3 bg-surface-container-low/40 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <span className="font-bold text-on-surface whitespace-nowrap uppercase">{stage.name}</span>
              <div className="relative flex-1 max-w-xs">
                <Search
                  size={14}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant pointer-events-none"
                />
                <input
                  className={FILTER_SEARCH_CLASS}
                  placeholder="Filtrar tarefas..."
                  value={filterMap[stage.id] ?? ""}
                  onChange={(e) =>
                    setFilterMap((prev) => ({ ...prev, [stage.id]: e.target.value }))
                  }
                />
              </div>
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
             <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
              <Button 
                variant="outline" 
                className="h-10 px-3 text-sm"
                onClick={() => {
                  setOpenSortDropdown(null)
                  setOpenFilterDropdown(openFilterDropdown === stage.id ? null : stage.id)
                }}>
                Filtro
              </Button>
              {openFilterDropdown === stage.id && (
                <div className="absolute top-full right-0 mt-2 w-64 bg-surface-container-highest border border-outline-variant rounded-lg shadow-lg z-20">
                    <div className="p-3 space-y-3">
                      <div>
                        <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Tipo de filtro</label>
                        <select
                          className={FILTER_FIELD_CLASS}
                          value={selectedFilterType[stage.id] ?? "NONE"}
                          onChange={(e) => {
                            const mode = e.target.value as "NONE" | "STATUS" | "PRIORITY" | "ASSIGNEE"
                            setSelectedFilterType((prev) => ({ ...prev, [stage.id]: mode }))
                            setSelectedFilterValue((prev) => ({ ...prev, [stage.id]: "" }))
                          }}
                        >
                          <option value="NONE">Nenhum</option>
                          <option value="STATUS">Status</option>
                          <option value="PRIORITY">Prioridade</option>
                          <option value="ASSIGNEE">Responsável</option>
                        </select>
                      </div>
                      {selectedFilterType[stage.id] !== "NONE" && (
                        <div>
                          <label className="block text-xs font-bold text-on-surface-variant mb-1.5">Valor</label>
                          <select
                            className={FILTER_FIELD_CLASS}
                            value={selectedFilterValue[stage.id] ?? ""}
                            onChange={(e) => setSelectedFilterValue((prev) => ({ ...prev, [stage.id]: e.target.value }))}
                          >
                            <option value="">Todos</option>
                            {(
                              selectedFilterType[stage.id] === "STATUS"
                                ? ["TODO", "IN_PROGRESS", "BLOCKED", "DONE"]
                                : selectedFilterType[stage.id] === "PRIORITY"
                                ? ["LOW", "MEDIUM", "HIGH"]
                                : selectedFilterType[stage.id] === "ASSIGNEE"
                                ? Array.from(new Set(tasks.map((t: Tarefa) => String(t.assigneeName || ""))).values()).filter(Boolean)
                                : []
                            ).map((option) => (
                              <option key={option} value={option}>
                                {selectedFilterType[stage.id] === "STATUS"
                                  ? getStatusDisplay(option as TarefaStatus).label
                                  : selectedFilterType[stage.id] === "PRIORITY"
                                  ? getPriorityDisplay(option as TarefaPriority)
                                  : option}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                      <Button 
                        variant="outline" 
                        className="w-full text-sm" 
                        onClick={() => setOpenFilterDropdown(null)}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative" onMouseDown={(e) => e.stopPropagation()}>
                <Button 
                  variant="outline" 
                  className="h-10 px-3 text-sm"
                  onClick={() => {
                    setOpenFilterDropdown(null)
                    setOpenSortDropdown(openSortDropdown === stage.id ? null : stage.id)
                  }}>
                  Ordenar
                </Button>
                {openSortDropdown === stage.id && (
                  <div className="absolute top-full right-0 mt-2 w-56 bg-surface-container-highest border border-outline-variant rounded-lg shadow-lg z-20">
                    <div className="p-3 space-y-2">
                      <label className="block text-xs font-bold text-on-surface-variant mb-2">Ordenar por</label>
                      <select
                        className={FILTER_FIELD_CLASS}
                        value={selectedSortOrder[stage.id] ?? "ALPHABETICAL"}
                        onChange={(e) => {
                          setSelectedSortOrder((prev) => ({ ...prev, [stage.id]: e.target.value as "ALPHABETICAL" | "START_DATE" | "END_DATE" }))
                          setOpenSortDropdown(null)
                        }}
                      >
                        <option value="ALPHABETICAL">Ordem alfabética</option>
                        <option value="START_DATE">Data de início</option>
                        <option value="END_DATE">Data de fim</option>
                      </select>
                      <Button 
                        variant="outline" 
                        className="w-full text-sm" 
                        onClick={() => setOpenSortDropdown(null)}
                      >
                        Fechar
                      </Button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Tabela de tarefas */}
         <div className="overflow-x-auto rounded-b-xl overflow-hidden">
         <table className="w-full text-left border-collapse table-auto">
          <thead>
            <tr className="border-b border-outline-variant/30 bg-surface-container-low/50">
              <th className="px-4 py-4 w-px whitespace-nowrap font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant">Status</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap">Tarefa</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap hidden sm:table-cell">Prioridade</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap hidden md:table-cell">Data Início</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap hidden md:table-cell">Data Fim</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap hidden lg:table-cell">Responsável</th>
              <th className="px-4 py-4 font-label text-[10px] uppercase tracking-[0.2em] text-on-surface-variant whitespace-nowrap text-center">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/10">
            {tasks.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-5 text-on-surface-variant">
                  Nenhuma tarefa encontrada nesta etapa
                </td>
              </tr>
            ) : (
              tasks.map((tarefa: Tarefa) => {
                const statusDisplay = getStatusDisplay(tarefa.status)
                const rowOpacity = getRowOpacity(tarefa.status)
                const titleDecoration = getTitleDecoration(tarefa.status)

                return (
                  <tr
                    key={tarefa.id}
                    onClick={() => setSelectedTask({ stageId: stage.id, tarefa })}
                    className={`group hover:bg-primary/5 transition-colors cursor-pointer ${rowOpacity}`}
                  >
                    <td className="px-4 py-3">
                      <span className={`${statusDisplay.bgColor} ${statusDisplay.textColor} px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest ${statusDisplay.borderColor} inline-flex items-center gap-1.5 border whitespace-nowrap`}>
                        {statusDisplay.icon ? (
                          statusDisplay.icon
                        ) : (
                          <span className={`w-1.5 h-1.5 rounded-full ${statusDisplay.bgColor === "bg-secondary-container/20" ? "bg-secondary" : "bg-on-surface-variant"} ${statusDisplay.pulse ? "animate-pulse" : ""}`} />
                        )}
                        {statusDisplay.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 min-w-0">
                      <span className={`font-display font-bold text-on-surface text-base block truncate ${titleDecoration}`}>
                        {tarefa.title}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-on-surface-variant text-sm font-body">{getPriorityDisplay(tarefa.priority)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-on-surface-variant text-sm font-body tabular-nums">{formatDate(tarefa.plannedStartDate)}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-on-surface-variant text-sm font-body tabular-nums">{formatDate(tarefa.plannedEndDate)}</span>
                    </td>
                    <td className="px-4 py-3 hidden lg:table-cell">
                      <span className="text-on-surface-variant text-sm font-body truncate block max-w-35">{tarefa.assigneeName || "-"}</span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex justify-center gap-1">
                        <Button
                          variant="ghost"
                          className="p-1.5 hover:bg-primary/10 rounded-full transition-all"
                          onClick={(e) => { e.stopPropagation(); setEditingTask({ stageId: stage.id, tarefa }) }}
                        >
                          <Pencil size={15} />
                        </Button>
                        <Button
                          variant="ghost"
                          className="p-1.5 text-error hover:bg-error/10 rounded-full transition-all"
                          disabled={deleteMutation.isPending}
                          onClick={(e) => { e.stopPropagation(); openDeleteModal(stage.id, tarefa.id, tarefa.title) }}
                        >
                          <Trash2 size={15} />
                        </Button>
                      </div>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>

          <div className="px-6 py-3 flex justify-end border-t border-outline-variant/10">
            <Button onClick={() => setOpenStageForCreate(stage.id)} variant="primary" className="flex items-center gap-1.5 font-semibold shadow-sm">
            <Plus size={15} />
              Adicionar tarefa
            </Button>
          </div>
        </div>
      ))}

      <TaskFormModal
        open={openStageForCreate !== null}
        onClose={() => setOpenStageForCreate(null)}
        stageId={openStageForCreate}
        projectId={projectId}
      />

      <TaskFormModal
        open={editingTask !== null}
        onClose={() => setEditingTask(null)}
        stageId={editingTask?.stageId ?? null}
        projectId={projectId}
        tarefaToEdit={editingTask?.tarefa ?? null}
        onSaved={() => {
          queryClient.invalidateQueries({ queryKey: ["tarefas"] })
          refetch()
        }}
      />

      <Modal
        open={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={selectedTask?.tarefa.title ?? "Detalhes da tarefa"}
        size="lg"
      >
        <div className="px-6 pb-6 space-y-4">
          <div>
            <h3 className="text-sm font-bold text-on-surface-variant">Descrição</h3>
            <p className="mt-2 text-on-surface text-sm">{selectedTask?.tarefa.description || '-'}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant">Status</h4>
              <p className="mt-1">{selectedTask ? getStatusDisplay(selectedTask.tarefa.status).label : '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant">Prioridade</h4>
              <p className="mt-1">{selectedTask ? getPriorityDisplay(selectedTask.tarefa.priority) : '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant">Data Início</h4>
              <p className="mt-1">{selectedTask ? formatDate(selectedTask.tarefa.plannedStartDate) : '-'}</p>
            </div>
            <div>
              <h4 className="text-xs font-bold text-on-surface-variant">Data Fim</h4>
              <p className="mt-1">{selectedTask ? formatDate(selectedTask.tarefa.plannedEndDate) : '-'}</p>
            </div>
            <div className="col-span-2">
              <h4 className="text-xs font-bold text-on-surface-variant">Responsável</h4>
              <p className="mt-1">{selectedTask?.tarefa.assigneeName || '-'}</p>
            </div>
          </div>

          <div className="flex items-center justify-between gap-3 mx-6 mt-5 mb-6 pt-5 border-t border-outline-variant">
            <div>
            <Button variant="outline"
              className="border-error/40 text-error hover:bg-error/10 hover:border-error w-auto px-4"
              onClick={() => { if (selectedTask) { openDeleteModal(selectedTask.stageId, selectedTask.tarefa.id, selectedTask.tarefa.title); setSelectedTask(null) } }}>
              <Trash2 size={14} /> Excluir
            </Button>
            </div>
            <div className="flex items-center gap-3">
              <Button variant="outline"
              className="w-auto px-4"
              onClick={() => setSelectedTask(null)}>Fechar</Button>
              
              <Button variant="primary" 
              className="w-auto px-4"
              onClick={() => { setSelectedTask(null); setEditingTask(selectedTask!) }}>Editar</Button>
            </div>
          </div>
        </div>
      </Modal>

      <Modal
        open={!!tarefaToDelete}
        onClose={closeDeleteModal}
        title="Deletar tarefa"
        description={`Tem certeza que deseja deletar a tarefa "${tarefaToDelete?.title}"?`}
        icon={<Trash2 size={20} />}
        variant="danger"
        size="sm"
      >
        <div className="px-6 pb-6 space-y-5">
          <div className="flex gap-3">
            <Button variant="outline" onClick={closeDeleteModal} disabled={deleteMutation.isPending}>
              Cancelar
            </Button>
            <Button
              className="bg-error text-on-error border-0 hover:brightness-[0.92]"
              onClick={handleConfirmDelete}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending ? (
                <><Loader size={16} className="animate-spin mr-2" />Deletando...</>
              ) : 'Deletar'}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  )
}