import type { ButtonHTMLAttributes } from "react"

type ButtonVariant =
  // Gradiente ouro + glow. **Um por vista** (Style Guide v2 §5).
  | "primary"
  // Secundário do design: borda forte, texto de apoio.
  | "outline"
  // Terciário do design: só texto, para "Ver todas ›".
  | "ghost"
  // Destrutivo: fundo translúcido de perigo.
  | "destructive"
  // Itens de navegação por abas.
  | "menu"
  | "menuSelected"

type ButtonSize =
  // Altura 38–44px do design. Padrão: é o botão de formulário e de ação de tela.
  | "md"
  // Compacto, para ações que acompanham um título. Na altura cheia elas
  // competiam com o H1 ao lado.
  | "sm"

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
