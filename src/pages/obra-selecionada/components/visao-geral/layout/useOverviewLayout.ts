import { useEffect, useMemo, useState } from "react"
import { useTranslation } from "react-i18next"
import { toast } from "react-toastify"

import { usePreference } from "@/shared/hooks/usePreference"
import { PreferenceKeys } from "@/shared/services/preferences.service"

import { WIDGETS } from "../widgets/registry"
import { defaultLayout, normalize, sameLayout, type OverviewLayout } from "./layoutModel"

export interface UseOverviewLayoutResult {
  /** O que desenhar: o rascunho durante a edição, senão o salvo. */
  layout: OverviewLayout
  isLoading: boolean
  editing: boolean
  dirty: boolean
  isSaving: boolean
  startEditing: () => void
  /** Aplica uma operação do layoutModel ao rascunho. */
  apply: (change: (layout: OverviewLayout) => OverviewLayout) => void
  /** Volta o rascunho ao padrão; só vale de verdade depois de Salvar. */
  restoreDefault: () => void
  cancel: () => void
  save: () => Promise<void>
}

/**
 * Estado da customização da Visão Geral.
 *
 * Tudo acontece num RASCUNHO local: arrastar, remover e "Restaurar padrão" não
 * tocam o servidor até Salvar — Cancelar descarta de graça. Salvar o próprio
 * padrão apaga a preferência (DELETE) em vez de gravar uma cópia dele, para o
 * usuário seguir recebendo as mudanças de padrão que vierem depois.
 */
export function useOverviewLayout(): UseOverviewLayoutResult {
  const { t } = useTranslation()
  const preference = usePreference<OverviewLayout>(PreferenceKeys.PROJECT_OVERVIEW_LAYOUT)
  const saved = useMemo(() => normalize(preference.value, WIDGETS), [preference.value])
  const [draft, setDraft] = useState<OverviewLayout | null>(null)

  const editing = draft !== null
  const dirty = draft !== null && !sameLayout(draft, saved)

  // Fechar a aba com mudança não salva pergunta antes. A navegação interna não
  // dá para interceptar: o app usa <BrowserRouter>, sem o useBlocker.
  useEffect(() => {
    if (!dirty) return
    const warn = (event: BeforeUnloadEvent) => event.preventDefault()
    window.addEventListener("beforeunload", warn)
    return () => window.removeEventListener("beforeunload", warn)
  }, [dirty])

  async function save() {
    if (!draft) return
    if (!dirty) {
      setDraft(null)
      return
    }
    try {
      if (sameLayout(draft, defaultLayout(WIDGETS))) {
        await preference.reset()
      } else {
        await preference.save(draft)
      }
      setDraft(null)
      toast.success(t("obra.visaoGeral.customize.saved"))
    } catch {
      toast.error(t("obra.visaoGeral.customize.saveError"))
    }
  }

  return {
    layout: draft ?? saved,
    isLoading: preference.isLoading,
    editing,
    dirty,
    isSaving: preference.isSaving,
    startEditing: () => setDraft(saved),
    apply: (change) => setDraft((current) => change(current ?? saved)),
    restoreDefault: () => setDraft(defaultLayout(WIDGETS)),
    cancel: () => setDraft(null),
    save,
  }
}
