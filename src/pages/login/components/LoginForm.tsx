import { ArrowRight, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Brand } from "@/shared/components/brand/Brand"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"

import { useLoginForm } from "../hooks/useLoginForm"

export function LoginForm() {
  const { formData, showPassword, handleChange, handleSubmit, togglePassword, isPending } = useLoginForm()
  const { t } = useTranslation()

  const passwordToggle = (
    <button
      type="button"
      onClick={togglePassword}
      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
      className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  return (
    <section className="relative flex h-full w-full flex-col items-center justify-center overflow-y-auto bg-surface px-8 py-12 sm:px-16 lg:w-[45%] lg:px-24">
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-12">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="enter-up space-y-2 text-center" style={{ animationDelay: "0.16s" }}>
          <h2 className="text-3xl font-bold tracking-tight text-on-surface">{t("login.title")}</h2>
          <p className="text-sm leading-relaxed text-on-surface-variant">{t("login.subtitle")}</p>
        </div>

        <form className="enter-up space-y-6" onSubmit={handleSubmit} noValidate style={{ animationDelay: "0.24s" }}>
          <div className="space-y-2">
            <Label htmlFor="email">{t("login.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("login.emailPlaceholder")}
              value={formData.email}
              onChange={handleChange}
              prefix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">{t("login.password")}</Label>
              <Link
                to="/forgot-password"
                className="text-sm font-medium text-gold-bright underline-offset-4 transition-colors hover:underline"
              >
                {t("login.forgotPassword")}
              </Link>
            </div>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="current-password"
              placeholder={t("login.passwordPlaceholder")}
              value={formData.password}
              onChange={handleChange}
              prefix={<Lock size={20} />}
              suffix={passwordToggle}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("login.submitting") : t("login.submit")}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

        <p className="enter-up text-center text-sm text-on-surface-variant" style={{ animationDelay: "0.48s" }}>
          {t("login.noAccount")}{" "}
          <Link to="/cadastro" className="ml-1 font-bold text-gold-bright underline-offset-4 hover:underline">
            {t("login.register")}
          </Link>
        </p>
      </div>
    </section>
  )
}
