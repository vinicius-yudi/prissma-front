import { ConstructionHero } from "./components/ConstructionHero"
import { LoginForm } from "./components/LoginForm"
import "./login.css"

export function LoginPage() {
  return (
    <main className="bf-login flex h-screen w-full overflow-hidden bg-[#020617]">
      <LoginForm />
      <ConstructionHero />
    </main>
  )
}
