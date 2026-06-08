import { ArrowRight, Eye, EyeOff, Lock, Mail, Undo2, User } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"
import { AuthInput } from "@/pages/login/components/AuthInput"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { ReturnButton } from "./ReturnButton"

interface CadastroFormData {
  name: string
  email: string
  password: string
  confirmPassword: string
}

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

const submit = tv({
  base: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_50%,#4f46e5_100%)] font-semibold text-white transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none",
})

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
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:text-[#cbd5e1] cursor-pointer"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  return (
    <section className="relative flex h-full w-full flex-col justify-center overflow-y-auto rounded-l-[28px] border-l border-[#1e2a3d] bg-[linear-gradient(180deg,#07111f_0%,#020617_100%)] px-8 py-12 sm:px-12 lg:w-[40%] lg:max-w-[560px] lg:px-12 lg:py-16">
      <div className="absolute left-5 top-5 z-10">
        <ReturnButton icon={Undo2} onClick={onBack}>
          {t("register.back")}
        </ReturnButton>
      </div>
      <div className="absolute right-5 top-5 z-10">
        <LanguageSelect />
      </div>

      <div className="mx-auto w-full max-w-[400px]">
        {/* Heading */}
        <div className="bf-enter bf-delay-2 mb-8">
          <h1 className="text-[2rem] font-bold leading-tight text-[#f8fafc]">{title}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{t("register.formSubtitle")}</p>
        </div>

        <form className="bf-enter bf-delay-3 space-y-5" onSubmit={onSubmit} noValidate>
          <AuthInput
            id="name"
            name="name"
            type="text"
            autoComplete="name"
            label={t("register.fullName")}
            placeholder={t("register.fullNamePlaceholder")}
            icon={<User size={18} />}
            value={formData.name}
            onChange={onChange}
          />

          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label={t("register.email")}
            placeholder={t("register.emailPlaceholder")}
            icon={<Mail size={18} />}
            value={formData.email}
            onChange={onChange}
          />

          <AuthInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            label={t("register.password")}
            placeholder="••••••••"
            icon={<Lock size={18} />}
            suffix={passwordToggle}
            value={formData.password}
            onChange={onChange}
          />

          <AuthInput
            id="confirmPassword"
            name="confirmPassword"
            type={showPassword ? "text" : "password"}
            autoComplete="new-password"
            label={t("register.confirmPassword")}
            placeholder="••••••••"
            icon={<Lock size={18} />}
            suffix={passwordToggle}
            value={formData.confirmPassword}
            onChange={onChange}
          />

          <button type="submit" disabled={isPending} className={submit()}>
            {isPending ? t("register.submitting") : t("register.submit")}
            {isPending ? null : <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer */}
        <p className="bf-enter bf-delay-6 mt-8 text-center text-sm text-[#94a3b8]">
          {t("register.hasAccount")}{" "}
          <Link to="/login" className="font-semibold text-[#3b82f6] transition-colors hover:text-[#60a5fa]">
            {t("register.login")}
          </Link>
        </p>
      </div>
    </section>
  )
}
