import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import { useTranslation } from "react-i18next"

import lottie404Url from "@/assets/lotties/Under Maintenance.lottie?url"

export function NotFoundPage() {
  const { t } = useTranslation()

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] gap-2 text-center">
      <DotLottieReact
        src={lottie404Url}
        loop
        autoplay
        style={{ width: "100%", height: "100%", maxWidth: "820px", maxHeight: "820px" }}
      />
      <p className="text-3xl font-bold tracking-[0.3em] uppercase text-primary">
        {t("notFound.code")}
      </p>
      <h1 className="text-xs font-black tracking-[0.2em] uppercase text-on-surface">
        {t("notFound.title")}
      </h1>
    </div>
  )
}
