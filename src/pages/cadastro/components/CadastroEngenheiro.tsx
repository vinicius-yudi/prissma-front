import { Brand } from "@/shared/components/brand/Brand"
import { Button } from "@/shared/components/ui/button/Button"
import { Input } from "@/shared/components/ui/input/Input"
import { Label } from "@/shared/components/ui/label/Label"
import { ArrowRight, Eye, EyeOff, Mail, Undo2 } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ThemeToggle } from "@/shared/components/ui/theme-toggle/ThemeToggle"
import { useCadastroEngenheiro } from "../hooks/useCadastroEngenheiro"
import { ReturnButton } from "./ReturnButton"

export function CadastroEngenheiro() {
  const { formDataEngenheiro, showPassword, handleChange, handleSubmit, togglePassword, isPending } = useCadastroEngenheiro()
  const { t } = useTranslation()

  return (
    <section className="w-full lg:w-[45%] h-full flex flex-col items-center px-6 sm:px-16 lg:px-24 pt-20 pb-10 lg:py-12 overflow-y-auto relative bg-surface">
      <div className="absolute left-4 top-4 z-10">
        <ReturnButton icon={Undo2} type="button" onClick={() => window.location.reload()}>
          {t("register.back")}
        </ReturnButton>
      </div>
      <div className="absolute top-4 right-4 z-10 flex items-center gap-2">
        <LanguageSelect />
        <ThemeToggle />
      </div>
      <div className="w-full max-w-md space-y-6 sm:space-y-8 my-auto">
        <div className="flex justify-center">
          <Brand />
        </div>

        <div className="text-center space-y-2">
          <h2 className="text-on-surface text-2xl sm:text-3xl font-bold tracking-tight">{t("register.titleEngineer")}</h2>
          <p className="text-sm text-on-surface-variant">
            {t("register.formSubtitle")}
          </p>
        </div>

        <form className="space-y-6" onSubmit={handleSubmit} noValidate>
          <div className="space-y-2">
            <Label htmlFor="name">{t("register.fullName")}</Label>
            <Input
              id="name"
              name="name"
              type="text"
              placeholder={t("register.fullNamePlaceholder")}
              value={formDataEngenheiro.name}
              onChange={handleChange}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="email">{t("register.email")}</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder={t("register.emailPlaceholder")}
              value={formDataEngenheiro.email}
              onChange={handleChange}
              suffix={<Mail size={20} />}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">{t("register.password")}</Label>
            <Input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formDataEngenheiro.password}
              onChange={handleChange}
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

          <div className="space-y-2">
            <Label htmlFor="confirmPassword">{t("register.confirmPassword")}</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={formDataEngenheiro.confirmPassword}
              onChange={handleChange}
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
              {isPending ? t("register.submitting") : t("register.submit")}
              {!isPending && <ArrowRight size={18} />}
            </Button>
          </div>
        </form>

        <div className="text-center pb-5">
          <p className="text-sm text-on-surface-variant">
            {t("register.hasAccount")}{" "}
            <Link
              to="/login"
              className="font-bold text-gold-bright underline-offset-4 hover:underline ml-1"
            >
              {t("register.login")}
            </Link>
          </p>
        </div>
      </div>
    </section>
  )
}
