import { AuthShell } from "@/shared/components/auth/AuthShell"

import { ResetPasswordForm } from "./components/ResetPasswordForm"

export function ResetPasswordPage() {
  return (
    <AuthShell>
      <ResetPasswordForm />
    </AuthShell>
  )
}
