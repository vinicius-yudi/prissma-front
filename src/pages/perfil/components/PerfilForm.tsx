import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { Select } from "@/shared/components/ui/select/Select"
import { Eye, EyeOff, Save } from "lucide-react"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { usePerfilForm } from "../hooks/usePerfilForm"

const LABELS = {
	name: "Nome",
	email: "E-mail",
	role: "Papel",
	newPassword: "Nova senha",
	newPasswordPlaceholder: "Deixe em branco para não alterar",
	confirmPassword: "Confirmar nova senha",
	save: "Salvar alterações",
	saving: "Salvando...",
	loading: "Carregando perfil...",
} as const

const ROLE_OPTIONS = [
	{ value: "ENG", label: "Engenheiro" },
	{ value: "USER", label: "Usuário" },
] as const

const EyeOnIcon = <Eye size={20} />
const EyeOffIcon = <EyeOff size={20} />
const SaveIcon = <Save size={18} />

export function PerfilForm() {
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

	if (isLoading) {
		return (
			<p className="py-8 text-center text-sm text-on-surface-variant">
				{LABELS.loading}
			</p>
		)
	}

	const passwordSuffix = (
		<button
			type="button"
			onClick={togglePassword}
			className="hover:text-slate-600 transition-colors cursor-pointer"
		>
			{showPassword ? EyeOffIcon : EyeOnIcon}
		</button>
	)

	const confirmSuffix = (
		<button
			type="button"
			onClick={toggleConfirm}
			className="hover:text-slate-600 transition-colors cursor-pointer"
		>
			{showConfirm ? EyeOffIcon : EyeOnIcon}
		</button>
	)

	return (
		<form className="space-y-6" onSubmit={handleSubmit}>
			<div className="space-y-2">
				<Label htmlFor="name">{LABELS.name}</Label>
				<Input
					id="name"
					name="name"
					type="text"
					value={form.name}
					onChange={handleChange}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="email">{LABELS.email}</Label>
				<Input
					id="email"
					name="email"
					type="email"
					value={form.email}
					onChange={handleChange}
					required
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="role">{LABELS.role}</Label>
				<Select
					id="role"
					name="role"
					value={form.role}
					onChange={handleRoleChange}
				>
					{ROLE_OPTIONS.map((option) => (
						<option key={option.value} value={option.value}>
							{option.label}
						</option>
					))}
				</Select>
			</div>

			<div className="space-y-2">
				<Label htmlFor="newPassword">{LABELS.newPassword}</Label>
				<Input
					id="newPassword"
					name="newPassword"
					type={showPassword ? "text" : "password"}
					placeholder={LABELS.newPasswordPlaceholder}
					value={form.newPassword}
					onChange={handleChange}
					suffix={passwordSuffix}
				/>
			</div>

			<div className="space-y-2">
				<Label htmlFor="confirmPassword">{LABELS.confirmPassword}</Label>
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
					{isPending ? LABELS.saving : LABELS.save}
					{!isPending && SaveIcon}
				</Button>
			</div>

			<ToastContainer position="top-right" theme="dark" />
		</form>
	)
}
