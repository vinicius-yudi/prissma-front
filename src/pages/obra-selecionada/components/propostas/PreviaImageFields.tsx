import { useTranslation } from "react-i18next"

import { Label } from "@/shared/components/ui/label/Label"
import { IMAGE_ACCEPT_ATTRIBUTE, MAX_ATTACHMENT_SIZE_MB } from "@/shared/constants/attachments"

import type { UsePreviaFormResult } from "../../hooks/usePreviaForm"
import { AttachmentDropzone } from "../AttachmentDropzone"
import { AttachmentImage } from "../AttachmentImage"

const ACCEPT_LABEL = "PNG · JPG · WEBP"

/** Foto do ambiente (obrigatória, com miniatura) e planta baixa (opcional). */
export function PreviaImageFields({ state }: { state: UsePreviaFormResult }) {
  const { t } = useTranslation()
  const { rawImage, floorPlan } = state

  return (
    <>
      <div className="grid gap-1.5">
        <Label>{t("obra.propostas.previa.fields.rawImage")}</Label>
        {rawImage ? (
          <div className="space-y-2">
            <div className="aspect-[3/2] w-full overflow-hidden rounded-md hairline">
              {/* A URL `blob:` nasce e morre com o <img> — sem effect. */}
              <AttachmentImage blob={rawImage} alt={t("obra.propostas.previa.rawImageAlt")} className="size-full object-cover" />
            </div>
            <div className="flex items-center justify-between gap-3">
              <span className="t-num min-w-0 truncate text-[12px] text-meta">{rawImage.name}</span>
              <button type="button" onClick={() => state.pickRawImage(null)} className="flex-none cursor-pointer text-[12.5px] font-[620] text-gold-hi hover:underline">
                {t("obra.propostas.previa.changeFile")}
              </button>
            </div>
          </div>
        ) : (
          <AttachmentDropzone accept={IMAGE_ACCEPT_ATTRIBUTE} acceptLabel={ACCEPT_LABEL} maxSizeMb={MAX_ATTACHMENT_SIZE_MB} isUploading={false} onFile={state.pickRawImage} />
        )}
        {state.rawImageMissing && (
          <p role="alert" className="text-[12.5px] font-[560] text-danger">
            {t("obra.propostas.previa.rawImageRequired")}
          </p>
        )}
      </div>

      <div className="grid gap-1.5">
        <Label>{t("obra.propostas.previa.fields.floorPlan")}</Label>
        {floorPlan ? (
          <div className="flex items-center justify-between gap-3 rounded-md bg-raised px-4 py-3 hairline">
            <span className="t-num min-w-0 truncate text-[12.5px] text-ink-2">{floorPlan.name}</span>
            <button type="button" onClick={() => state.pickFloorPlan(null)} className="flex-none cursor-pointer text-[12.5px] font-[620] text-gold-hi hover:underline">
              {t("obra.propostas.previa.removeFile")}
            </button>
          </div>
        ) : (
          <AttachmentDropzone accept={IMAGE_ACCEPT_ATTRIBUTE} acceptLabel={ACCEPT_LABEL} maxSizeMb={MAX_ATTACHMENT_SIZE_MB} isUploading={false} onFile={state.pickFloorPlan} />
        )}
        <p className="text-[12px] text-meta">{t("obra.propostas.previa.floorPlanHint")}</p>
      </div>
    </>
  )
}
