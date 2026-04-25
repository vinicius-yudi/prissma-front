import logo from "@/assets/svg/logo.svg"
import { SelectionButton } from "./SelectionButton"
import { Link } from "react-router-dom"
import { HardHat, DraftingCompass, User } from "lucide-react"

interface CadastroTypeProps {
  onTypeSelected: (type: "arquiteto" | "engenheiro" | "cliente") => void
}

export function CadastroType({ onTypeSelected }: CadastroTypeProps) {
  return (
    <section className="w-full lg:w-[45%] h-full flex flex-col items-center px-6 sm:px-16 lg:px-24 pt-16 pb-10 lg:py-12 overflow-y-auto bg-surface">
      <div className="w-full max-w-md space-y-8 sm:space-y-12 my-auto">
        <div className="flex justify-center">
          <img src={logo} alt="Prissma" className="h-25" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-white text-2xl sm:text-3xl font-bold tracking-tight">Crie sua conta</h2>
          <p className="text-sm text-on-surface-variant">
            Escolha o tipo de conta que deseja criar
          </p>
        </div>

        <div className="text-center space-y-2 w-full">
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={HardHat} type="button" onClick={() => onTypeSelected("arquiteto")}>
              Criar conta de Arquiteto
            </SelectionButton>
          </div>
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={DraftingCompass} type="button" onClick={() => onTypeSelected("engenheiro")}>
              Criar conta de Engenheiro
            </SelectionButton>
          </div>
          <div className="space-y-4 pt-4 w-full">
            <SelectionButton icon={User} type="button" onClick={() => onTypeSelected("cliente")}>
              Criar conta de Cliente
            </SelectionButton>
          </div>
        </div>

        <div className="text-center">
          <p className="text-sm text-on-surface-variant">
            Já possui uma conta?{" "}
            <Link
              to="/login"
              className="font-bold text-secondary underline-offset-4 hover:underline ml-1"
            >
              Faça login
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
