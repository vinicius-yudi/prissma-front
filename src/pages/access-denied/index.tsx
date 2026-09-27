import { ShieldOff } from "lucide-react"
import { useTranslation } from "react-i18next"
import { useNavigate } from "react-router-dom"

import { Button } from "@/shared/components/ui/button/Button"
import { EmptyState } from "@/shared/components/ui/empty-state/EmptyState"

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
    <div className="flex min-h-[60vh] items-center">
      <EmptyState
        as="h1"
        icon={
          <span className="flex size-14 items-center justify-center rounded-lg bg-danger-soft text-danger">
            <ShieldOff size={26} />
          </span>
        }
        title={t("accessDenied.title")}
        body={t("accessDenied.description")}
        action={
          <Button variant="outline" fullWidth={false} onClick={() => navigate("/obras")}>
            {t("accessDenied.action")}
          </Button>
        }
      />
    </div>
  )
}
