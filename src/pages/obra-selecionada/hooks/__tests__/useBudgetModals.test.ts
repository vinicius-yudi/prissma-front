import { act, renderHook } from "@testing-library/react"
import { describe, expect, it } from "vitest"

import type { BudgetItem, Expense } from "@/shared/types/budget"

import { useBudgetModals } from "../useBudgetModals"
import { useExpandedCategories } from "../useExpandedCategories"

/**
 * O módulo de orçamento tem três formulários e três confirmações de exclusão
 * no mesmo lugar. A união discriminada existe para que só um esteja aberto por
 * vez — dois booleanos independentes deixariam abrir "editar item" por cima de
 * "nova despesa". É esse invariante que os testes cobram.
 */

const item = { id: 9, category: "Materiais" } as BudgetItem
const despesa = { id: 20, description: "Areia" } as Expense

describe("useBudgetModals", () => {
  it("começa com tudo fechado", () => {
    const { result } = renderHook(() => useBudgetModals())

    expect(result.current.modal).toEqual({ kind: "closed" })
    expect(result.current.deleteTarget).toBeNull()
  })

  it("abre o formulário do orçamento", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openBudgetForm())

    expect(result.current.modal).toEqual({ kind: "budget" })
  })

  // O mesmo formulário serve para criar e editar: `item: null` é criação.
  it("abre o formulário de item em branco ou preenchido", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openItemForm())
    expect(result.current.modal).toEqual({ kind: "item", item: null })

    act(() => result.current.openItemForm(item))
    expect(result.current.modal).toEqual({ kind: "item", item })
  })

  // A despesa sempre pertence a um item, então o `itemId` viaja junto mesmo na
  // edição — sem ele o formulário não sabe onde criar.
  it("abre o formulário de despesa carregando o item dono", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openExpenseForm(9))
    expect(result.current.modal).toEqual({ kind: "expense", itemId: 9, expense: null })

    act(() => result.current.openExpenseForm(9, despesa))
    expect(result.current.modal).toEqual({ kind: "expense", itemId: 9, expense: despesa })
  })

  it("troca de formulário sem deixar o anterior aberto", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openBudgetForm())
    act(() => result.current.openItemForm(item))

    expect(result.current.modal.kind).toBe("item")
  })

  it("fecha o formulário", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openItemForm(item))
    act(() => result.current.closeModal())

    expect(result.current.modal).toEqual({ kind: "closed" })
  })

  it("registra o alvo de exclusão de cada tipo", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.requestDeleteBudget(5))
    expect(result.current.deleteTarget).toEqual({ kind: "budget", id: 5 })

    act(() => result.current.requestDeleteItem(9))
    expect(result.current.deleteTarget).toEqual({ kind: "item", id: 9 })

    act(() => result.current.requestDeleteExpense(20))
    expect(result.current.deleteTarget).toEqual({ kind: "expense", id: 20 })
  })

  it("cancela a exclusão", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.requestDeleteItem(9))
    act(() => result.current.closeDelete())

    expect(result.current.deleteTarget).toBeNull()
  })

  // Confirmação e formulário são independentes: pedir exclusão a partir do
  // menu de um item não pode fechar o formulário que estiver aberto.
  it("mantém formulário e confirmação independentes", () => {
    const { result } = renderHook(() => useBudgetModals())

    act(() => result.current.openItemForm(item))
    act(() => result.current.requestDeleteItem(9))

    expect(result.current.modal.kind).toBe("item")
    expect(result.current.deleteTarget).toEqual({ kind: "item", id: 9 })
  })
})

describe("useExpandedCategories", () => {
  it("começa com todas as categorias fechadas", () => {
    const { result } = renderHook(() => useExpandedCategories())

    expect(result.current.isExpanded(9)).toBe(false)
  })

  it("abre e fecha a mesma categoria", () => {
    const { result } = renderHook(() => useExpandedCategories())

    act(() => result.current.toggle(9))
    expect(result.current.isExpanded(9)).toBe(true)

    act(() => result.current.toggle(9))
    expect(result.current.isExpanded(9)).toBe(false)
  })

  // Várias abertas ao mesmo tempo é o comportamento desejado: o usuário
  // compara categorias lado a lado.
  it("mantém várias categorias abertas", () => {
    const { result } = renderHook(() => useExpandedCategories())

    act(() => result.current.toggle(9))
    act(() => result.current.toggle(10))

    expect(result.current.isExpanded(9)).toBe(true)
    expect(result.current.isExpanded(10)).toBe(true)
  })

  // O `Set` é copiado a cada troca; mutá-lo no lugar não dispararia render e a
  // categoria abriria só no próximo clique em outra coisa.
  it("gera um estado novo a cada troca, para o React perceber", () => {
    const { result } = renderHook(() => useExpandedCategories())
    const antes = result.current.isExpanded

    act(() => result.current.toggle(9))

    expect(result.current.isExpanded).not.toBe(antes)
  })
})
