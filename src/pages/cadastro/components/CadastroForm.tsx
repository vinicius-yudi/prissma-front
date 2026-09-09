import { ArrowRight, Eye, EyeOff, Lock, Mail, Undo2, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"

import { Brand } from "@/shared/components/brand/Brand"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"

import { ReturnButton } from "./ReturnButton"
import type { CadastroFormData } from "../types"

/**
 * Formulário de cadastro dos três perfis (arquiteto, engenheiro, cliente).
 *
 * Os três eram arquivos de ~140 linhas com JSX idêntico — só o título e o hook
 * mudavam. O que varia entra por prop; cada perfil ficou como um casco fino em
 * cima do seu próprio hook.
 */

interface CadastroFormProps {
  title: string
  formData: CadastroFormData
  showPassword: boolean
  isPending: boolean
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void
  onTogglePassword: () => void
  onBack: () => void
}

export function CadastroForm({
  title,
  formData,
  showPassword,
  isPending,
  onChange,
  onSubmit,
  onTogglePassword,
  onBack,
}: CadastroFormProps) {
  const { t } = useTranslation()

  const passwordToggle = (
    <button
      type="button"
      onClick={onTogglePassword}
      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
      className="cursor-pointer text-on-surface-variant transition-colors hover:text-on-surface"
    >
      {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
    </button>
  )

  return (
    <section className="relative flex h-full w-full flex-col items-center overflow-y-auto bg-surface px-6 pb-10 pt-20 sm:px-16 lg:w-[45%] lg:px-24 lg:py-12">
      <div className="absolute left-4 top-4 z-10">
        <ReturnButton icon={Undo2} type="button" onClick={onBack}>
          {t("register.back")}
        </ReturnButton>
      </div>
      <div className="absolute right-4 top-4 z-10 flex items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>

      <div className="my-auto w-full max-w-md space-y-6 sm:space-y-8">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="enter-up space-y-2 text-center" style={{ animationDelay: "0.16s" }}>
          <h2 className="text-2xl font-bold tracking-tight text-on-surface sm:text-3xl">{title}</h2>
          <p className="text-sm text-on-surface-variant">{t("register.formSubtitle")}</p>
        </div>

        <form className="enter-up space-y-6" onSubmit={onSubmit} noValidate style={{ animationDelay: "0.24s" }}>
          <div className="space-y-2">
            <Label htmlFor="name">{t("register.fullName")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              autoComplete="name"
              placeholder={t("register.fullNamePlaceholder")}
              value={formData.name}
              onChange={onChange}
              prefix={<User size={20} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("register.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              placeholder={t("register.emailPlaceholder")}
              value={formData.email}
              onChange={onChange}
              prefix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("register.password")}</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.password}
              onChange={onChange}
              prefix={<Lock size={20} />}
              suffix={passwordToggle}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              autoComplete="new-password"
              placeholder="••••••••"
              value={formData.confirmPassword}
              onChange={onChange}
              prefix={<Lock size={20} />}
              suffix={passwordToggle}
            />
          </div>

          <div className="pt-4">
            <Button type="submit" disabled={isPending}>
              {isPending ? t("register.submitting") : t("register.submit")}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

        <p className="enter-up pb-5 text-center text-sm text-on-surface-variant" style={{ animationDelay: "0.48s" }}>
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="ml-1 font-bold text-gold-bright underline-offset-4 hover:underline">
            {t("register.login")}
          </Link>
        </p>
      </div>
    </section>
  )
}
