import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"

import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

/**
 * Rota inexistente dentro do app. Papel quadriculado vazio — "o espaço que
 * ainda não foi desenhado" — e o caminho de volta, sem ilustração (DS v2).
 */
export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex min-h-[60vh] items-center">
      <EmptyState
        as="h1"
        icon={<span className="t-hero text-[80px] text-gold-hi">{t("notFound.code")}</span>}
        title={t("notFound.title")}
        body={t("notFound.body")}
        action={
          <Link
            to="/dashboard"
            className="inline-flex h-11 items-center rounded-md bg-surface px-4 text-[14px] font-[620] text-ink hairline-strong hover:bg-raised"
          >
            {t("notFound.action")}
          </Link>
        }
      />
    </div>
  )
}
