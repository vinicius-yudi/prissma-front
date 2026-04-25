import { BrandPanel } from "@/pages/login/components/BrandPanel"
import { ResetPasswordForm } from "./components/ResetPasswordForm"

export function ResetPasswordPage() {
	return (
		<main className="flex h-screen overflow-hidden" style={{ backgroundColor: "#041617" }}>
			<BrandPanel />
			<ResetPasswordForm />
		</main>
	)
}
