import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useTranslation } from "react-i18next"
import homeLottie from "#/assets/lotties/Home.lottie?url"

export function BrandPanel() {
  const { t } = useTranslation()

  return (
    <section
      className="hidden lg:flex lg:w-[55%] h-full relative flex-col justify-between p-16 overflow-hidden bg-background"
    >
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, color-mix(in srgb, var(--pk-b1) 10%, transparent) 1px, transparent 1px),
            linear-gradient(to bottom, color-mix(in srgb, var(--pk-b1) 10%, transparent) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(138,211,214,0.10) 0%, transparent 70%)",
        }}
      />

      <div className="z-10">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
          {t("brand.name")}
        </span>
        <h1 className="text-white text-4xl font-bold leading-tight">
          {t("brand.headline")}<br />
          <span className="text-primary">{t("brand.headlineSuffix")}</span>
        </h1>
      </div>

      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full h-full z-10">
          <DotLottieReact src={homeLottie} loop autoplay className="w-full h-full" />
        </div>
      </div>

      <div className="z-10">
        <p className="text-on-surface-variant text-lg font-medium leading-snug">
          {t("brand.tagline")}
        </p>
        <p className="text-white text-2xl font-bold">
          {t("brand.taglineSuffix")}
        </p>
      </div>

      <div
        className="absolute bottom-0 left-0 w-full h-1/3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(1, 83, 76, 0.15), transparent)" }}
      />
    </section>
  )
}
