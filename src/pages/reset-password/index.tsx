import { BrandPanel } from "@/pages/login/components/BrandPanel"
import { ResetPasswordForm } from "./components/ResetPasswordForm"

export function ResetPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden bg-background">
			<BrandPanel />
			<ResetPasswordForm />
		</main>
	)
}
