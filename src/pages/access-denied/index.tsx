import { ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"

/**
 * Acesso negado — destino de quem chega por URL a um módulo que o seu papel
 * não alcança (Fluxos v2 §3).
 *
 * A sidebar já esconde o que o papel não vê; esta tela cobre o acesso direto.
 * O texto diz **por que** o acesso foi negado — bloqueio sem motivo é o que
 * faz o usuário achar que o sistema quebrou.
 */
export function AccessDeniedPage() {
  const { t } = useTranslation()
  const navigate = useNavigate()

  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center gap-4 text-center">
      <div className="flex size-14 items-center justify-center rounded-2xl bg-danger-bg text-danger">
        <ShieldOff size={26} strokeWidth={1.8} />
      </div>

      <div className="space-y-2">
        <h1 className="text-2xl font-bold text-on-surface">{t("accessDenied.title")}</h1>
        <p className="max-w-md text-sm text-on-surface-variant">{t("accessDenied.description")}</p>
      </div>

      <Button variant="outline" fullWidth={false} onClick={() => navigate("/obras")}>
        {t("accessDenied.action")}
      </Button>
    </div>
  )
}
