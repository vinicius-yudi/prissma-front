import { renderHook } from "@testing-library/react"
import { Pencil } from "lucide-react"
import type { ReactNode } from "react"
import { describe, expect, it, vi } from "vitest"

import { PrimaryActionProvider } from "../PrimaryActionProvider"
import { usePrimaryAction, useRegisteredPrimaryAction, type PrimaryAction } from "../primaryAction"

/**
 * O FAB da barra de abas vive no shell, mas a ação é da tela: cada página
 * registra a sua enquanto está montada e o FAB desenha o que estiver
 * registrado. Os testes cobrem os dois lados do registro e o desregistro.
 */

function wrapper({ children }: { children: ReactNode }) {
  return <PrimaryActionProvider>{children}</PrimaryActionProvider>
}

/** Registra do lado da tela e lê do lado do FAB, no mesmo provider. */
function renderRegistro(acaoInicial: PrimaryAction | null) {
  return renderHook(
    ({ acao }: { acao: PrimaryAction | null }) => {
      usePrimaryAction(acao)
      return useRegisteredPrimaryAction()
    },
    { wrapper, initialProps: { acao: acaoInicial } },
  )
}

describe("usePrimaryAction", () => {
  it("registra a ação da tela para o FAB ler", () => {
    const onClick = vi.fn()

    const { result } = renderRegistro({ label: "Nova obra", onClick })

    expect(result.current?.label).toBe("Nova obra")
  })

  it("repassa rótulo curto, ícone e desabilitado", () => {
    const { result } = renderRegistro({
      label: "Adicionar integrante",
      shortLabel: "Integrante",
      icon: Pencil,
      disabled: true,
      onClick: vi.fn(),
    })

    expect(result.current?.shortLabel).toBe("Integrante")
    expect(result.current?.icon).toBe(Pencil)
    expect(result.current?.disabled).toBe(true)
  })

  it("dispara o handler da tela quando o FAB é acionado", () => {
    const onClick = vi.fn()
    const { result } = renderRegistro({ label: "Nova obra", onClick })

    result.current?.onClick()

    expect(onClick).toHaveBeenCalledTimes(1)
  })

  /**
   * O `onClick` da tela é uma closure recriada a cada render. Ele fica numa
   * ref de propósito: se entrasse nas dependências do efeito, cada render
   * re-registraria a ação e o provider entraria em laço — mas o FAB ainda
   * precisa chamar a versão mais nova.
   */
  it("chama a versão mais recente do handler sem re-registrar", () => {
    const primeiro = vi.fn()
    const segundo = vi.fn()
    const { result, rerender } = renderRegistro({ label: "Nova obra", onClick: primeiro })

    rerender({ acao: { label: "Nova obra", onClick: segundo } })
    result.current?.onClick()

    expect(segundo).toHaveBeenCalledTimes(1)
    expect(primeiro).not.toHaveBeenCalled()
  })

  // É o que as telas passam quando o papel do usuário não pode criar nada.
  it("não registra nada quando a tela passa null", () => {
    const { result } = renderRegistro(null)

    expect(result.current).toBeNull()
  })

  it("desregistra quando a tela deixa de oferecer a ação", () => {
    const { result, rerender } = renderRegistro({ label: "Nova obra", onClick: vi.fn() })

    rerender({ acao: null })

    expect(result.current).toBeNull()
  })

  it("desregistra quando a tela desmonta", () => {
    const { result, unmount } = renderHook(
      () => {
        usePrimaryAction({ label: "Nova obra", onClick: vi.fn() })
        return useRegisteredPrimaryAction()
      },
      { wrapper },
    )
    expect(result.current?.label).toBe("Nova obra")

    unmount()
  })

  it("troca o registro quando o rótulo muda de aba", () => {
    const { result, rerender } = renderRegistro({ label: "Nova etapa", onClick: vi.fn() })

    rerender({ acao: { label: "Nova tarefa", onClick: vi.fn() } })

    expect(result.current?.label).toBe("Nova tarefa")
  })

  // Componentes de aba precisam funcionar isolados, fora do shell que monta o
  // provider.
  it("vira no-op fora do provider", () => {
    const { result } = renderHook(() => {
      usePrimaryAction({ label: "Nova obra", onClick: vi.fn() })
      return useRegisteredPrimaryAction()
    })

    expect(result.current).toBeNull()
  })
})
