import { BrandPanel } from "@/pages/login/components/BrandPanel"
import { ForgotPasswordForm } from "./components/ForgotPasswordForm"

export function ForgotPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden bg-background">
			<BrandPanel />
			<ForgotPasswordForm />
		</main>
	)
}
