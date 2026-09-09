import { useTranslation } from "react-i18next"

import { ConstructionHero } from "./ConstructionHero"

/**
 * Painel de marca das telas públicas (login, cadastro, recuperação, redefinição).
 *
 * Era um arquivo duplicado byte a byte em `pages/login/components` e
 * `pages/cadastro/components`, e as telas de senha importavam a versão do
 * login — um page importando componente de outro page. Agora é um só, aqui.
 *
 * As três texturas (grade técnica, brilho e esmaecimento) saíram de `style`
 * inline para utilitários em `styles/index.css`: eram textura de marca com cor
 * crua no meio do componente, e duas delas ainda estavam no teal da identidade
 * anterior.
 */
export function BrandPanel() {
  const { t } = useTranslation()

  return (
    <section className="relative hidden h-full flex-col justify-between overflow-hidden bg-background p-16 lg:flex lg:w-[55%]">
      <ConstructionHero />
      <div className="pointer-events-none absolute inset-0 bg-blueprint-grid" />
      <div className="pointer-events-none absolute left-0 top-0 size-[480px] bg-brand-glow" />

      <div className="z-10">
        <span className="mb-4 inline-block text-xs font-semibold uppercase tracking-widest text-primary">
          {t("brand.name")}
        </span>
        <h1 className="text-4xl font-bold leading-tight text-on-surface">
          {t("brand.headline")}
          <br />
          <span className="text-primary">{t("brand.headlineSuffix")}</span>
        </h1>
      </div>

      {/* A torre holográfica é desenhada pelo <ConstructionHero>, em camada
          absoluta sobre todo o painel; aqui fica só a folga que ela ocupa
          abaixo da headline. */}
      <div className="flex-1" />

      <div className="pointer-events-none absolute bottom-0 left-0 h-1/3 w-full bg-brand-fade" />
    </section>
  )
}
