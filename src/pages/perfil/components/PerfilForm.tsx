import { Eye, EyeOff, Save } from "lucide-react"
import { useTranslation } from "react-i18next"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"

import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Select } from "@/shared/components/ui/select/Select"
import { usePerfilForm } from "../hooks/usePerfilForm"

const EyeOnIcon = <Eye size={20} />
const EyeOffIcon = <EyeOff size={20} />
const SaveIcon = <Save size={18} />

export function PerfilForm() {
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
	} = usePerfilForm()

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
		<form className="space-y-6" onSubmit={handleSubmit}>
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

			<div className="pt-2">
				<Button type="submit" disabled={isPending}>
					{isPending ? t("profile.saving") : t("profile.save")}
					{!isPending && SaveIcon}
				</Button>
			</div>

			<ToastContainer position="top-right" theme="dark" />
		</form>
	)
}
