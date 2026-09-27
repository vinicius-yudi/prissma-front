import { AuthShell } from "@/shared/components/auth/AuthShell"

import { ForgotPasswordForm } from "./components/ForgotPasswordForm"

export function ForgotPasswordPage() {
  return (
    <AuthShell>
      <ForgotPasswordForm />
    </AuthShell>
  )
}
