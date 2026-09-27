import { BrandPanel } from "@/shared/components/brand/BrandPanel"
import { ForgotPasswordForm } from "./components/ForgotPasswordForm"

export function ForgotPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden bg-bg">
			<BrandPanel />
			<ForgotPasswordForm />
		</main>
	)
}
