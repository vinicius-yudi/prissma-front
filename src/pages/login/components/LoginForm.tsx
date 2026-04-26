import logo from "@/assets/svg/logo.svg"
import { ArrowRight, Eye, EyeOff, Mail } from "lucide-react"
import { Link } from "react-router-dom"
import { useTranslation } from "react-i18next"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { ToastContainer } from "react-toastify"
import "react-toastify/dist/ReactToastify.css"
import { useLoginForm } from "../hooks/useLoginForm"

const LOGO_ALT = "Prissma"

export function LoginForm() {
  const { formData, showPassword, handleChange, handleSubmit, togglePassword, isPending } = useLoginForm()
  const { t } = useTranslation()

  const passwordSuffix = (
    <button
      type="button"
      onClick={togglePassword}
      className="text-on-surface-variant hover:text-on-surface transition-colors cursor-pointer"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  return (
    <section className="w-full lg:w-[45%] h-full flex flex-col justify-center items-center px-8 sm:px-16 lg:px-24 py-12 overflow-y-auto bg-surface">
      <div className="w-full max-w-md space-y-12">
        <div className="flex justify-center">
          <img src={logo} alt={LOGO_ALT} className="h-25" />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-on-surface text-3xl font-bold tracking-tight">{t("login.title")}</h2>
          <p className="text-sm text-on-surface-variant">{t("login.subtitle")}</p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("login.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              required
              suffix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-secondary hover:underline underline-offset-4 transition-colors"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder={t("login.passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              required
              suffix={passwordSuffix}
            />
          </div>

          <div className="space-y-4 pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("login.submitting") : t("login.submit")}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

        <div className="text-center">
          <p className="text-sm text-on-surface-variant">
            {t("login.noAccount")}{" "}
            <Link
              to="/cadastro"
              className="font-bold text-secondary underline-offset-4 hover:underline ml-1"
            >
              {t("login.register")}
            </Link>
          </p>
        </div>
      </div>
      <ToastContainer position="top-right" theme="dark" />
    </section>
  )
}
