import type { ButtonHTMLAttributes } from "react"

type ButtonVariant =
  // Gradiente ouro. **Um por vista**.
  | "primary"
  // Contorno: secundária do mesmo contexto.
  | "outline"
  // Quieta: só texto ouro, para "Ver todas ›".
  | "ghost"
  // Perigo: só ação destrutiva.
  | "destructive"
  // Itens de navegação por abas.
  | "menu"
  | "menuSelected"

type ButtonSize =
  // 44px. Padrão: botão de formulário e de ação de tela.
  | "md"
  // 36px, para barras de ferramenta de aba e ações ao lado de um título.
  | "sm"
  // 40×40, só ícone — exige `aria-label`.
  | "icon"

interface InterfaceButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  size?: ButtonSize
  /**
   * Largura total. O padrão `true` preserva os formulários existentes, que
   * nasceram com botão em bloco. Botões de ação inline do design novo
   * ("+ Nova obra", "Editar obra") passam `fullWidth={false}`.
   */
  fullWidth?: boolean
}

export type { ButtonSize, ButtonVariant, InterfaceButtonProps }
