import { AlertTriangle, Check, Info } from "lucide-react"
import type { IconProps } from "react-toastify"
import { tv } from "tailwind-variants"

const circle = tv({
  base: "mt-0.5 flex size-6 flex-none items-center justify-center rounded-full text-on-inverse",
  variants: {
    tone: {
      success: "bg-success",
      danger: "bg-danger",
      neutral: "bg-gold",
    },
  },
})

type Tone = "success" | "danger" | "neutral"

const TONE_BY_TYPE: Record<IconProps["type"], Tone> = {
  success: "success",
  error: "danger",
  warning: "danger",
  info: "neutral",
  default: "success",
}

/**
 * Ícone circular do toast (DS v2): confirmação em `success`; a ação criou um
 * problema (erro, estouro) em `danger`.
 */
export function ToastIcon({ type }: IconProps) {
  const tone = TONE_BY_TYPE[type]

  return (
    <span className={circle({ tone })}>
      {tone === "danger" && <AlertTriangle size={13} strokeWidth={2.4} />}
      {tone === "success" && <Check size={13} strokeWidth={3} />}
      {tone === "neutral" && <Info size={13} strokeWidth={2.4} />}
    </span>
  )
}
