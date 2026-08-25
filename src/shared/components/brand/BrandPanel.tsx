import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useTranslation } from "react-i18next"

import homeLottie from "@/assets/lotties/Home.lottie?url"

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

      <div className="relative flex flex-1 items-center justify-center">
        <div className="relative z-10 size-full">
          <DotLottieReact src={homeLottie} loop autoplay className="size-full" />
        </div>
      </div>

      <div className="z-10">
        <p className="text-lg font-medium leading-snug text-on-surface-variant">
          {t("brand.tagline")}
        </p>
        <p className="text-2xl font-bold text-on-surface">{t("brand.taglineSuffix")}</p>
      </div>

      <div className="pointer-events-none absolute bottom-0 left-0 h-1/3 w-full bg-brand-fade" />
    </section>
  )
}
