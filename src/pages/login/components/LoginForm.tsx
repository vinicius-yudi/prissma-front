import logo from "@/assets/svg/logo.svg"
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useLoginForm } from "../hooks/useLoginForm"

export function LoginForm() {
  const { formData, showPassword, handleChange, handleSubmit, togglePassword, isPending } = useLoginForm()

  return (
    <section className="w-full lg:w-[45%] h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto bg-surface">
      <div className="w-full max-w-md space-y-12">
        <div className="flex justify-center">
          <img src={logo} alt="Prissma" className="h-25" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-white text-3xl font-bold tracking-tight">Bem-vindo de volta</h2>
          <p className="text-sm text-on-surface-variant">
            Entre com suas credenciais para acessar sua conta.
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="nome@empresa.com.br"
              value={formData.email}
              onChange={handleChange}
              required
              suffix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Senha *</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-secondary hover:underline underline-offset-4 transition-colors"
              >
                Esqueceu?
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formData.password}
              onChange={handleChange}
              required
              suffix={
                <button
                  type="button"
                  onClick={togglePassword}
                  className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
                >
                  {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                </button>
              }
            />
          </div>

          <div className="space-y-4 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? "Entrando..." : "Entrar"}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-on-surface-variant">
            Não tem uma conta?{" "}
            <Link
              to="/cadastro"
              className="font-bold text-secondary underline-offset-4 hover:underline ml-1"
            >
              Cadastre-se
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" />
    </section>
  )
}
