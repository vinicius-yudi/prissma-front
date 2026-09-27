import { useState } from "react"

import { AuthShell } from "@/shared/components/auth/AuthShell"

import { CadastroForm } from "./components/CadastroForm"
import { CadastroType } from "./components/CadastroType"
import type { CadastroKind } from "./constants/cadastroKinds"

export function CadastroPage() {
  const [kind, setKind] = useState<CadastroKind | null>(null)

  // Uma casca só: trocar de passo refaz a entrada do conteúdo (`step`) sem
  // remontar o painel de marca ao lado.
  return (
    <AuthShell step={kind ?? "type"}>
      {kind ? (
        <CadastroForm kind={kind} onBack={() => setKind(null)} />
      ) : (
        <CadastroType onTypeSelected={setKind} />
      )}
    </AuthShell>
  )
}
