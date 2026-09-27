import { Eye, EyeOff } from "lucide-react"
import { forwardRef, useState } from "react"
import { useTranslation } from "react-i18next"

import { Input } from "@/shared/components/ui/input/Input"
import type { InterfaceInputProps } from "@/shared/components/ui/input/InputInterface"

type PasswordInputProps = Omit<InterfaceInputProps, "type" | "suffix">

/** Campo de senha com mostrar/ocultar. A ref chega ao `<input>` (react-hook-form). */
export const PasswordInput = forwardRef<HTMLInputElement, PasswordInputProps>(function PasswordInput(
  props,
  ref,
) {
  const { t } = useTranslation()
  const [visible, setVisible] = useState(false)

  return (
    <Input
      ref={ref}
      type={visible ? "text" : "password"}
      suffix={
        <button
          type="button"
          onClick={() => setVisible((current) => !current)}
          aria-label={visible ? t("login.hidePassword") : t("login.showPassword")}
          className="flex size-8 cursor-pointer items-center justify-center rounded-[8px] text-ink-3 transition-colors hover:text-ink"
        >
          {visible ? <EyeOff size={16} /> : <Eye size={16} />}
        </button>
      }
      {...props}
    />
  )
})
