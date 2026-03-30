import logo from "@/assets/svg/logo.svg"
import { SelectionButton } from "./SelectionButton"
import { HardHat , DraftingCompass, User } from "lucide-react"

export function CadastroType() {
  return (
    <section
      className="w-full lg:w-[45%] flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12"
      style={{ backgroundColor: "#0a1a1b" }}
    >
        <div className="w-full max-w-md space-y-12">
            <div className="flex justify-center">
                <img src={logo} alt="Prissma" className="h-25" />
            </div>

            <div className="text-center space-y-2">
                <h2 className="text-white text-3xl font-bold tracking-tight">Crie sua conta</h2>
                <p className="text-sm" style={{ color: "#bec8c8" }}>
                    Escolha o tipo de conta que deseja criar
                </p>
            </div>

            <div className="text-center space-y-2 w-full">
                <div className="space-y-4 pt-4 w-full">
                    <SelectionButton icon={HardHat} type="submit">
                        Criar conta de Arquiteto
                    </SelectionButton>
                </div>
                <div className="space-y-4 pt-4 w-full">
                    <SelectionButton icon={DraftingCompass} type="submit">
                        Criar conta de Engenheiro
                    </SelectionButton>
                </div>
                <div className="space-y-4 pt-4 w-full">
                    <SelectionButton icon={User} type="submit">
                        Criar conta de Cliente
                    </SelectionButton>
                </div>
            </div>
            <div className="text-center">
                <p className="text-sm" style={{ color: "#bec8c8" }}>
                    Já possui uma conta?{" "}
                    <a
                    href="#"
                    className="font-bold underline-offset-4 hover:underline ml-1"
                    style={{ color: "#8ad3d6" }}
                    >
                    Faça login
                    </a>
                </p>
            </div>
        </div>
  </section>
)
}