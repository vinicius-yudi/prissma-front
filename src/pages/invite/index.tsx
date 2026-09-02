import { Loader } from "lucide-react"
import { useState, type FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { Link, useSearchParams } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { acceptInvite } from "@/shared/services/workspace.service"

/**
 * Aceite de convite — rota PÚBLICA (`/invite?token=`): o convidado pode ainda
 * não ter conta. Nome e senha só são exigidos pelo backend quando o e-mail é
 * novo; para quem já tem conta os campos são ignorados no servidor.
 */
export function InvitePage() {
  const { t } = useTranslation()
  const [searchParams] = useSearchParams()
  const token = searchParams.get("token")

  const [fullName, setFullName] = useState("")
  const [password, setPassword] = useState("")
  const [status, setStatus] = useState<"idle" | "submitting" | "success">("idle")
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(event: FormEvent) {
    event.preventDefault()
    if (!token) return
    setStatus("submitting")
    setError(null)
    try {
      await acceptInvite(token, {
        fullName: fullName.trim() || undefined,
        password: password || undefined,
      })
      setStatus("success")
    } catch (err) {
      setStatus("idle")
      setError(err instanceof Error && err.message ? err.message : t("invitePage.error"))
    }
  }

  return (
    <main className="flex min-h-dvh items-center justify-center bg-surface p-4">
      <div className="w-full max-w-md rounded-2xl border border-outline-variant bg-surface-container-low p-6 sm:p-8">
        <h1 className="text-lg font-semibold text-on-surface">{t("invitePage.title")}</h1>

        {!token && <p className="mt-4 text-sm text-danger">{t("invitePage.missingToken")}</p>}

        {token && status === "success" && (
          <div className="mt-4 space-y-4">
            <p className="text-sm text-on-surface-variant">{t("invitePage.success")}</p>
            <Link to="/login">
              <Button className="w-full">{t("invitePage.goLogin")}</Button>
            </Link>
          </div>
        )}

        {token && status !== "success" && (
          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            <p className="text-sm text-on-surface-variant">{t("invitePage.hint")}</p>

            <Input
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder={t("invitePage.nameLabel")}
              aria-label={t("invitePage.nameLabel")}
            />
            <div>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t("invitePage.passwordLabel")}
                aria-label={t("invitePage.passwordLabel")}
              />
              <p className="mt-1 text-xs text-on-surface-faint">{t("invitePage.passwordHint")}</p>
            </div>

            {error && <p className="text-sm text-danger">{error}</p>}

            <Button type="submit" disabled={status === "submitting"} className="w-full">
              {status === "submitting" && <Loader size={16} className="animate-spin" />}
              {status === "submitting" ? t("invitePage.accepting") : t("invitePage.accept")}
            </Button>
          </form>
        )}
      </div>
    </main>
  )
}
