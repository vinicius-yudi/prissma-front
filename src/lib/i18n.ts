import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "../locales/en.json"
import es from "../locales/es.json"
import pt from "../locales/pt.json"

const STORAGE_KEY = "prissma-lang"
const DEFAULT_LANG = "pt"
const VALID_LANGS = ["pt", "en", "es"] as const

function getInitialLang(): string {
  const stored = localStorage.getItem(STORAGE_KEY)
  if (stored && (VALID_LANGS as readonly string[]).includes(stored)) return stored
  return DEFAULT_LANG
}

i18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: getInitialLang(),
  fallbackLng: DEFAULT_LANG,
  interpolation: { escapeValue: false },
})

export { STORAGE_KEY as I18N_STORAGE_KEY }
export default i18n
