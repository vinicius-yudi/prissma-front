import { BrandPanel } from "@/pages/login/components/BrandPanel"
import { ForgotPasswordForm } from "./components/ForgotPasswordForm"

export function ForgotPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden" style={{ backgroundColor: "#041617" }}>
			<BrandPanel />
			<ForgotPasswordForm />
		</main>
	)
}
