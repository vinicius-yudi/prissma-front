import { BrandPanel } from "./components/BrandPanel"
import { LoginForm } from "./components/LoginForm"

export function LoginPage() {
  return (
    <main className="flex h-screen overflow-hidden" style={{ backgroundColor: "#041617" }}>
      <BrandPanel />
      <LoginForm />
    </main>
  )
}
