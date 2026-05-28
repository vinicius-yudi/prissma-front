import { ArrowRight,Check, Eye, EyeOff, Lock, Mail } from "lucide-react"
import { useTranslation } from "react-i18next"
import { Link } from "react-router-dom"
import { tv } from "tailwind-variants"
import { LanguageSelect } from "@/shared/components/ui/language-select/LanguageSelect"
import { useLoginForm } from "../hooks/useLoginForm"
import { AuthInput } from "./AuthInput"

const BRAND_NAME = "BuildFlow"

const checkbox = tv({
  base: "flex h-[18px] w-[18px] items-center justify-center rounded-[5px] border transition-colors",
  variants: {
    checked: {
      true: "border-[#2563eb] bg-[#2563eb]",
      false: "border-[#1e2a3d] bg-[#101b2d]",
    },
  },
})

const submit = tv({
  base: "flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-[linear-gradient(135deg,#2563eb_0%,#3b82f6_50%,#4f46e5_100%)] font-semibold text-white transition-all duration-200 cursor-pointer hover:-translate-y-0.5 hover:shadow-[0_0_28px_rgba(59,130,246,0.5)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#60a5fa] disabled:cursor-not-allowed disabled:opacity-70 disabled:hover:translate-y-0 disabled:hover:shadow-none",
})

export function LoginForm() {
  const { t } = useTranslation()
  const {
    formData,
    showPassword,
    rememberMe,
    handleChange,
    handleSubmit,
    togglePassword,
    toggleRememberMe,
    isPending,
  } = useLoginForm()

  const passwordToggle = (
    <button
      type="button"
      onClick={togglePassword}
      aria-label={showPassword ? t("login.hidePassword") : t("login.showPassword")}
      className="flex h-9 w-9 items-center justify-center rounded-lg text-[#64748b] transition-colors hover:text-[#cbd5e1] cursor-pointer"
    >
      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
    </button>
  )

  return (
    <section className="relative flex h-full w-full flex-col justify-center overflow-y-auto rounded-r-[28px] border-r border-[#1e2a3d] bg-[linear-gradient(180deg,#07111f_0%,#020617_100%)] px-8 py-12 sm:px-12 lg:w-[40%] lg:max-w-[560px] lg:px-12 lg:py-16">
      <div className="absolute right-5 top-5 z-10">
        <LanguageSelect />
      </div>

      <div className="mx-auto w-full max-w-[400px]">
        
        {/* Heading */}
        <div className="bf-enter bf-delay-2 mb-8">
          <h1 className="text-[2rem] font-bold leading-tight text-[#f8fafc]">{t("login.title")}</h1>
          <p className="mt-2 text-sm leading-relaxed text-[#94a3b8]">{t("login.subtitle")}</p>
        </div>

        <form className="bf-enter bf-delay-3 space-y-5" onSubmit={handleSubmit} noValidate>
          <AuthInput
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            label={t("login.email")}
            placeholder={t("login.emailPlaceholder")}
            icon={<Mail size={18} />}
            value={formData.email}
            onChange={handleChange}
          />

          <AuthInput
            id="password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete="current-password"
            label={t("login.password")}
            placeholder={t("login.passwordPlaceholder")}
            icon={<Lock size={18} />}
            suffix={passwordToggle}
            value={formData.password}
            onChange={handleChange}
          />

          <div className="flex items-center justify-between">
            <label className="flex cursor-pointer select-none items-center gap-2">
              <input
                type="checkbox"
                className="sr-only"
                checked={rememberMe}
                onChange={toggleRememberMe}
              />
              <span className={checkbox({ checked: rememberMe })}>
                {rememberMe ? <Check size={12} strokeWidth={3.5} className="text-white" /> : null}
              </span>
              <span className="text-sm text-[#cbd5e1]">{t("login.rememberMe")}</span>
            </label>

            <Link
              to="/forgot-password"
              className="text-sm font-medium text-[#3b82f6] transition-colors hover:text-[#60a5fa]"
            >
              {t("login.forgotPassword")}
            </Link>
          </div>

          <button type="submit" disabled={isPending} className={submit()}>
            {isPending ? t("login.submitting") : t("login.submit")}
            {isPending ? null : <ArrowRight size={18} />}
          </button>
        </form>

        {/* Footer */}
        <p className="bf-enter bf-delay-6 mt-8 text-center text-sm text-[#94a3b8]">
          {t("login.noAccount")}{" "}
          <Link to="/cadastro" className="font-semibold text-[#3b82f6] transition-colors hover:text-[#60a5fa]">
            {t("login.register")}
          </Link>
        </p>
      </div>

      <span className="sr-only">{BRAND_NAME}</span>
    </section>
  )
}
