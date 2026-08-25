import { BrandPanel } from "@/shared/components/brand/BrandPanel"
import { LoginForm } from "./components/LoginForm"

export function LoginPage() {
  return (
    <main className="flex h-screen overflow-hidden bg-background">
      <BrandPanel />
      <LoginForm />
    </main>
  )
}
