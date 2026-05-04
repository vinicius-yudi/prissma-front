import { Eye, EyeOff, Save, Trash2 } from "lucide-react"
import { useTranslation } from "react-i18next"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Select } from "@/shared/components/ui/select/Select"

import { usePerfilForm } from "../hooks/usePerfilForm"

const EyeOnIcon = <Eye size={20} />
const EyeOffIcon = <EyeOff size={20} />
const SaveIcon = <Save size={18} />

interface PerfilFormProps {
  open: boolean
  onClose: () => void
  onDeleteAccount: () => void
}

export function PerfilForm({ open, onClose, onDeleteAccount }: PerfilFormProps) {
  const { t } = useTranslation()
  const {
    form,
    isLoading,
    isPending,
    showPassword,
    showConfirm,
    handleChange,
    handleRoleChange,
    handleSubmit,
    togglePassword,
    toggleConfirm,
  } = usePerfilForm({ open, onClose })

  const ROLE_OPTIONS = [
    { value: "ENG", label: t("profile.roles.engineer") },
    { value: "USER", label: t("profile.roles.user") },
  ]

  if (isLoading) {
    return (
      <p className="py-8 text-center text-sm text-on-surface-variant">
        {t("profile.loading")}
      </p>
    )
  }

  const passwordSuffix = (
    <button
      type="button"
      onClick={togglePassword}
      className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
    >
      {showPassword ? EyeOffIcon : EyeOnIcon}
    </button>
  )

  const confirmSuffix = (
    <button
      type="button"
      onClick={toggleConfirm}
      className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
    >
      {showConfirm ? EyeOffIcon : EyeOnIcon}
    </button>
  )

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <div className="space-y-2">
        <Label htmlFor="name">{t("profile.name")}</Label>
        <Input id="name" name="name" type="text" value={form.name} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="email">{t("profile.email")}</Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor="role">{t("profile.role")}</Label>
        <Select id="role" name="role" value={form.role} onChange={handleRoleChange}>
          {ROLE_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="newPassword">{t("profile.newPassword")}</Label>
        <Input
          id="newPassword"
          name="newPassword"
          type={showPassword ? "text" : "password"}
          placeholder={t("profile.newPasswordPlaceholder")}
          value={form.newPassword}
          onChange={handleChange}
          suffix={passwordSuffix}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="confirmPassword">{t("profile.confirmPassword")}</Label>
        <Input
          id="confirmPassword"
          name="confirmPassword"
          type={showConfirm ? "text" : "password"}
          value={form.confirmPassword}
          onChange={handleChange}
          suffix={confirmSuffix}
        />
      </div>

      <div className="pt-2 flex items-center gap-3">
        <Button
          type="button"
          variant="outline"
          onClick={onDeleteAccount}
          className="flex-1 text-error border-error hover:bg-error/10"
        >
          <Trash2 size={14} />
          {t("profile.deleteAccount")}
        </Button>
        <Button type="submit" disabled={isPending} className="flex-1">
          {isPending ? t("profile.saving") : t("profile.save")}
          {!isPending && SaveIcon}
        </Button>
      </div>
    </form>
  )
}
