import { AuthShell } from "@/shared/components/auth/AuthShell"

import { LoginForm } from "./components/LoginForm"

export function LoginPage() {
  return (
    <AuthShell>
      <LoginForm />
    </AuthShell>
  )
}
