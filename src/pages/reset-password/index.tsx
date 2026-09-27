import { BrandPanel } from "@/shared/components/brand/BrandPanel"
import { ResetPasswordForm } from "./components/ResetPasswordForm"

export function ResetPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden bg-bg">
			<BrandPanel />
			<ResetPasswordForm />
		</main>
	)
}
