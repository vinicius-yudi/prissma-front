import { X } from "lucide-react"
import { useTranslation } from "react-i18next"
import type { CloseButtonProps } from "react-toastify"

/** Botão de dispensar do toast, na cor do texto invertido. */
export function ToastCloseButton({ closeToast }: CloseButtonProps) {
  const { t } = useTranslation()

  return (
    <button
      type="button"
      aria-label={t("common.dismiss")}
      onClick={closeToast}
      className="flex size-8 flex-none cursor-pointer items-center justify-center rounded-[8px] opacity-60 transition-opacity hover:opacity-100"
    >
      <X size={14} />
    </button>
  )
}
