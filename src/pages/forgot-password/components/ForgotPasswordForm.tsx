import logo from "@/assets/svg/logo.svg"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { ArrowLeft, ArrowRight, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { useForgotPasswordForm } from "../hooks/useForgotPasswordForm"

export function ForgotPasswordForm() {
	const { email, setEmail, handleSubmit, isPending, submitted } = useForgotPasswordForm()

	return (
		<section className="relative w-full lg:w-[45%] h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto bg-surface">
			<div className="absolute top-4 right-4 z-10 flex items-center gap-2">
				<LanguageSelect />
				<ThemeToggle />
			</div>
			<div className="w-full max-w-md space-y-12">
				<div className="flex justify-center">
					<img src={logo} alt="Prissma" className="h-25" />
				</div>

				{submitted ? (
					<div className="text-center space-y-6">
						<div className="space-y-2">
							<h2 className="text-white text-3xl font-bold tracking-tight">Verifique seu e-mail</h2>
							<p className="text-sm text-on-surface-variant">
								Se o e-mail <span className="font-semibold text-secondary">{email}</span> estiver
								cadastrado, você receberá um link para redefinir sua senha em breve.
							</p>
						</div>
						<Link
							to="/login"
							className="flex items-center justify-center gap-2 text-sm font-medium text-secondary hover:underline underline-offset-4 transition-colors"
						>
							<ArrowLeft size={16} />
							Voltar ao login
						</Link>
					</div>
				) : (
					<>
						<div className="text-center space-y-2">
							<h2 className="text-white text-3xl font-bold tracking-tight">Esqueceu a senha?</h2>
							<p className="text-sm text-on-surface-variant">
								Informe seu e-mail e enviaremos um link para redefinir sua senha.
							</p>
						</div>

						<form className="space-y-6" onSubmit={handleSubmit}>
							<div className="space-y-2">
								<Label htmlFor="email">Email *</Label>
								<Input
									id="email"
									name="email"
									type="email"
									placeholder="nome@empresa.com.br"
									value={email}
									onChange={(e) => setEmail(e.target.value)}
									required
									suffix={<Mail size={20} />}
								/>
							</div>

							<div className="space-y-4 pt-4">
								<Button type="submit" disabled={isPending}>
									{isPending ? "Enviando..." : "Enviar link"}
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
								Voltar ao login
							</Link>
						</div>
					</>
				)}
			</div>
		</section>
	)
}
