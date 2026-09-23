import type { LucideIcon } from "lucide-react"
import { createContext, useContext, useEffect, useRef } from "react"

/**
 * Registro da ação primária da tela.
 *
 * No celular a barra de abas tem um FAB central, e o que ele faz muda por tela
 * ("Nova obra", "Nova etapa", "Nova tarefa"…). O botão vive no shell, mas a
 * ação é da página — que é quem sabe se pode criar (`canMutate`), se há etapa
 * onde pendurar a tarefa, se o orçamento existe. Em vez de subir todos os
 * modais para o layout, cada tela **registra** sua ação enquanto está montada e
 * o FAB renderiza o que estiver registrado.
 *
 * É o mesmo desenho do <PageChrome>: provider no layout, hook nas telas, no-op
 * fora do provider — assim os componentes de aba continuam funcionando
 * isolados. O provider mora em `PrimaryAction.tsx`; aqui fica só o que não é
 * componente, para o fast refresh não reclamar do arquivo misto.
 */

export interface PrimaryAction {
  /** Já traduzido: vira o `aria-label` do FAB e o botão da folha de menu. */
  label: string
  /**
   * Rótulo curto sob o FAB. O espaço ali é de uma palavra — "Adicionar
   * integrante" não cabe. Sem isto, usa o `label`.
   */
  shortLabel?: string
  onClick: () => void
  /** Padrão: `Plus`. */
  icon?: LucideIcon
  disabled?: boolean
}

export interface PrimaryActionValue {
  action: PrimaryAction | null
  setAction: (action: PrimaryAction | null) => void
}

export const PrimaryActionContext = createContext<PrimaryActionValue | null>(null)

/**
 * Registra a ação primária da tela enquanto ela estiver montada. `null`
 * desregistra — é o que as telas passam quando o papel não pode criar nada.
 *
 * Chame **antes de qualquer early return** do componente: um `if (isLoading)`
 * acima daqui pularia o hook e quebraria a ordem entre renders.
 */
export function usePrimaryAction(action: PrimaryAction | null): void {
  const ctx = useContext(PrimaryActionContext)

  // O `onClick` das telas costuma ser uma closure recriada a cada render. Se
  // ele entrasse nas dependências do efeito, cada render re-registraria a ação
  // e o provider entraria em laço. A ref mantém o efeito preso só ao que muda
  // de verdade — rótulo, ícone e disponibilidade.
  const onClickRef = useRef(action?.onClick)

  useEffect(() => {
    onClickRef.current = action?.onClick
  })

  const label = action?.label
  const shortLabel = action?.shortLabel
  const icon = action?.icon
  const disabled = action?.disabled
  const setAction = ctx?.setAction

  useEffect(() => {
    if (!setAction || !label) return

    setAction({
      label,
      shortLabel,
      icon,
      disabled,
      onClick: () => onClickRef.current?.(),
    })

    return () => setAction(null)
  }, [setAction, label, shortLabel, icon, disabled])
}

/** Lado da leitura — o FAB da barra de abas. */
export function useRegisteredPrimaryAction(): PrimaryAction | null {
  return useContext(PrimaryActionContext)?.action ?? null
}
