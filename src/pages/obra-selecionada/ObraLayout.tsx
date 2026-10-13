import { useTranslation } from "react-i18next"
import { useMatch, useNavigate, useParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

import { ObraView } from "./components/ObraView"
import { useObraSelecionada } from "./hooks/useObraSelecionada"

/**
 * Contexto de obra (nível 2).
 *
 * Carrega a obra uma vez e a entrega aos módulos filhos pelo Outlet do
 * <ObraView> — nenhum módulo refaz o fetch. Os módulos se navegam pelas abas
 * fixas, em todas as larguras.
 */
export function ObraLayout() {
  const { obraId } = useParams<{ obraId: string }>()
  const navigate = useNavigate()
  const { t } = useTranslation()
  const id = Number(obraId)
  const { projectQuery } = useObraSelecionada(id)
  const isVisaoGeral = useMatch("/obras/:obraId/visao-geral") !== null

  if (id && projectQuery.isLoading) {
    return (
      <div className="animate-pulse space-y-4" aria-busy="true">
        <div className="h-5 w-24 rounded bg-surface" />
        <div className="h-72 rounded-xl bg-surface hairline" />
        <div className="h-12 rounded bg-surface" />
      </div>
    )
  }

  if (!id || projectQuery.isError || !projectQuery.data) {
    return (
      <EmptyState
        as="h1"
        title={t("obra.notFound")}
        body={t("obra.notFoundDesc")}
        action={
          <Button variant="outline" fullWidth={false} onClick={() => navigate("/obras")}>
            {t("obra.backToList")}
          </Button>
        }
      />
    )
  }

  return <ObraView project={projectQuery.data} isVisaoGeral={isVisaoGeral} />
}
