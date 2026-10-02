import { useTranslation } from "react-i18next"
import { useSearchParams } from "react-router-dom"

import { AuthShell } from "@/shared/components/auth/AuthShell"

import { InviteForm } from "./components/InviteForm"

/**
 * Aceite de convite — rota PÚBLICA (`/invite?token=`): o convidado pode ainda
 * não ter conta.
 */
export function InvitePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  return (
    <AuthShell>
      <h1 className="t-title mb-6 text-[34px] text-ink">{t("invitePage.title")}</h1>
      {token ? (
        <InviteForm token={token} />
      ) : (
        <p role="alert" className="text-[15px] text-danger">
          {t("invitePage.missingToken")}
        </p>
      )}
    </AuthShell>
  )
}
