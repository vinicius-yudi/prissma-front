import { useEffect, useRef, useState } from "react"
import ReactCountryFlag from "react-country-flag"
import { useTranslation } from "react-i18next"
import { tv } from "tailwind-variants"

import i18n, { I18N_STORAGE_KEY } from "@/lib/i18n"

const LANGUAGES = [
  { code: "pt", countryCode: "BR", label: "Português" },
  { code: "en", countryCode: "US", label: "English" },
  { code: "es", countryCode: "ES", label: "Español" },
] as const

type LangCode = (typeof LANGUAGES)[number]["code"]

const FLAG_STYLE_TRIGGER: React.CSSProperties = { width: "1.25rem", height: "0.9rem" }
const FLAG_STYLE_OPTION: React.CSSProperties = { width: "1.375rem", height: "1rem" }

const langOption = tv({
  base: "flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-sm transition-colors",
  variants: {
    active: {
      true: "bg-primary/10 text-primary font-medium",
      false: "text-on-surface-variant hover:bg-surface-container-high",
    },
  },
})

function getCurrentLang(): LangCode {
  return (i18n.language as LangCode) ?? "pt"
}

function getLangData(code: LangCode) {
  return LANGUAGES.find((l) => l.code === code) ?? LANGUAGES[0]
}

export function LanguageSelect() {
  const { i18n: i18nInstance } = useTranslation()
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)
  const current = getLangData(getCurrentLang())

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleToggle() {
    setOpen((prev) => !prev)
  }

  function handleSelect(code: LangCode) {
    i18nInstance.changeLanguage(code)
    localStorage.setItem(I18N_STORAGE_KEY, code)
    setOpen(false)
  }

  function handleSelectPt() { handleSelect("pt") }
  function handleSelectEn() { handleSelect("en") }
  function handleSelectEs() { handleSelect("es") }

  const handlers: Record<LangCode, () => void> = {
    pt: handleSelectPt,
    en: handleSelectEn,
    es: handleSelectEs,
  }

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={handleToggle}
        className="flex items-center gap-2 rounded-lg border border-outline-variant bg-surface-container px-2.5 py-1.5 transition-colors hover:bg-surface-container-high cursor-pointer"
      >
        <ReactCountryFlag
          countryCode={current.countryCode}
          svg
          style={FLAG_STYLE_TRIGGER}
        />
        <span className="uppercase text-xs font-bold text-on-surface-variant">{current.code}</span>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-44 rounded-xl border border-outline-variant bg-surface-container py-1 shadow-lg z-50">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={handlers[lang.code]}
              className={langOption({ active: i18nInstance.language === lang.code })}
            >
              <ReactCountryFlag
                countryCode={lang.countryCode}
                svg
                style={FLAG_STYLE_OPTION}
              />
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
