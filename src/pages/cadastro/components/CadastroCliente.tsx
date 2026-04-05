import logo from "@/assets/svg/logo.svg"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { ArrowRight, Eye, EyeOff, Mail, Undo2 } from "lucide-react"
import { useCadastroForm } from "../hooks/useCadastroForm"
import { ReturnButton } from "./ReturnButton"

export function CadastroCliente() {
    const { formDataArquiteto: formDataCliente, showPassword, handleChange, handleSubmit, togglePassword, isPending, isError, errorMessage } = useCadastroForm()
  return (
    <section
      className="w-full lg:w-[45%] flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 relative"
      style={{ backgroundColor: "#0a1a1b" }}
    >
      <div className="absolute left-4 top-4 z-10">
        <ReturnButton icon={Undo2} type="button" onClick={() => window.location.reload()}>
          Voltar
        </ReturnButton>
      </div>
      <div className="w-full max-w-md space-y-12">
        <div className="flex justify-center">
          <img src={logo} alt="Prissma" className="h-25" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-white text-3xl font-bold tracking-tight">Crie sua conta como cliente</h2>
          <p className="text-sm" style={{ color: "#bec8c8" }}>
            Insira suas credenciais para continuar
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@empresa.com.br"
              value={formDataCliente.email}
              onChange={handleChange}
              required
              suffix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formDataCliente.password}
              onChange={handleChange}
              required
              suffix={
                <button
                  type="button"
                  onClick={togglePassword}
                  className="hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirme sua senha</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formDataCliente.confirmPassword}
              onChange={handleChange}
              required
              suffix={
                <button
                  type="button"
                  onClick={togglePassword}
                  className="hover:text-slate-600 transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          {isError && (
            <p className="text-sm text-center" style={{ color: "#ffb4ab" }}>
              {errorMessage}
            </p>
          )}

          <div className="space-y-4 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Realizando cadastro..." : "Confirmar"}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

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
