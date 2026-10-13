import { HardHat, Home, Ruler } from "lucide-react"
import type { LucideIcon } from "lucide-react"

import { cadastroArquiteto } from "../services/cadastroArquiteto.service"
import { cadastroCliente } from "../services/cadastroCliente.service"
import { cadastroEngenheiro } from "../services/cadastroEngenheiro.service"
import type { CadastroFormData } from "../types"

export const CadastroKind = {
  ENGINEER: "engineer",
  ARCHITECT: "architect",
  CLIENT: "client",
} as const

export type CadastroKind = (typeof CadastroKind)[keyof typeof CadastroKind]

interface KindConfig {
  icon: LucideIcon
  /** Serviço do perfil — cada um grava o papel global certo no backend. */
  register: (data: CadastroFormData) => Promise<{ token: string }>
}

/** Ordem da tela: quem planeja, quem projeta, quem acompanha. */
export const CADASTRO_KINDS: Record<CadastroKind, KindConfig> = {
  [CadastroKind.ENGINEER]: { icon: HardHat, register: cadastroEngenheiro },
  [CadastroKind.ARCHITECT]: { icon: Ruler, register: cadastroArquiteto },
  [CadastroKind.CLIENT]: { icon: Home, register: cadastroCliente },
}
