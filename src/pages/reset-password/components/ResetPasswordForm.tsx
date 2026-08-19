import logo from "@/assets/svg/logo.svg"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { ArrowLeft, ArrowRight, Eye, EyeOff } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { useResetPasswordForm } from "../hooks/useResetPasswordForm"

const LOGO_ALT = "Prissma"

export function ResetPasswordForm() {
	const {
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		showPassword,
		togglePassword,
		showConfirm,
		toggleConfirm,
		handleSubmit,
		isPending,
	} = useResetPasswordForm()
	const { t } = useTranslation()

	return (
		<section className="relative w-full lg:w-[45%] h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto bg-surface">
			<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
				<LanguageSelect />
				<ThemeToggle />
			</div>
			<div className="w-full max-w-md space-y-12">
				<div className="flex justify-center">
					<img src={logo} alt={LOGO_ALT} className="h-25" />
				</div>

				<div className="text-center space-y-2">
					<h2 className="text-on-surface text-3xl font-bold tracking-tight">{t("resetPassword.title")}</h2>
					<p className="text-sm text-on-surface-variant">{t("resetPassword.subtitle")}</p>
				</div>

				<form className="space-y-6" onSubmit={handleSubmit}>
					<div className="space-y-2">
						<Label htmlFor="newPassword">{t("resetPassword.newPassword")}</Label>
						<Input
							id="newPassword"
							name="newPassword"
							type={showPassword ? "text" : "password"}
							placeholder={t("resetPassword.passwordPlaceholder")}
							value={newPassword}
							onChange={(e) => setNewPassword(e.target.value)}
							required
							suffix={
								<button
									type="button"
									onClick={togglePassword}
									className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
								>
									{showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							}
						/>
					</div>

					<div className="space-y-2">
						<Label htmlFor="confirmPassword">{t("resetPassword.confirmPassword")}</Label>
						<Input
							id="confirmPassword"
							name="confirmPassword"
							type={showConfirm ? "text" : "password"}
							placeholder={t("resetPassword.passwordPlaceholder")}
							value={confirmPassword}
							onChange={(e) => setConfirmPassword(e.target.value)}
							required
							suffix={
								<button
									type="button"
									onClick={toggleConfirm}
									className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
								>
									{showConfirm ? <EyeOff size={20} /> : <Eye size={20} />}
								</button>
							}
						/>
					</div>

					<div className="space-y-4 pt-4">
						<Button type="submit" disabled={isPending}>
							{isPending ? t("resetPassword.submitting") : t("resetPassword.submit")}
							{!isPending && <ArrowRight size={18} />}
						</Button>
					</div>
				</form>

				<div className="text-center">
					<Link
						to="/login"
						className="flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:underline underline-offset-4 transition-colors"
					>
						<ArrowLeft size={16} />
						{t("resetPassword.backToLogin")}
					</Link>
				</div>
			</div>
		</section>
	)
}
