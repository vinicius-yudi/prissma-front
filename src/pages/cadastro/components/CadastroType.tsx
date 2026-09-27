import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { CADASTRO_KINDS } from "../constants/cadastroKinds"
import type { CadastroKind } from "../constants/cadastroKinds"
import { RoleCard } from "./RoleCard"

interface CadastroTypeProps {
  onTypeSelected: (kind: CadastroKind) => void
}

const KINDS = Object.keys(CADASTRO_KINDS) as CadastroKind[]

/** Primeiro passo do cadastro: como a pessoa participa das obras. */
export function CadastroType({ onTypeSelected }: CadastroTypeProps) {
  const { t } = useTranslation()

  return (
    <>
      <h1 className="t-title text-[36px] text-ink">{t("register.title")}</h1>
      <p className="mt-2 text-[15px] text-ink-2">{t("register.subtitle")}</p>

      <div className="mt-8 flex flex-col gap-3">
        {KINDS.map((kind, index) => (
          <RoleCard
            key={kind}
            icon={CADASTRO_KINDS[kind].icon}
            label={t(`register.kinds.${kind}.label`)}
            body={t(`register.kinds.${kind}.body`)}
            index={index}
            onSelect={() => onTypeSelected(kind)}
          />
        ))}
      </div>

      <p className="mt-8 text-[14px] text-ink-2">
        {t("register.hasAccount")}{" "}
        <Link to="/login" className="font-[650] text-gold-hi hover:underline">
          {t("register.login")}
        </Link>
      </p>
    </>
  )
}
