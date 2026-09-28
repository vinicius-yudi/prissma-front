import i18n from "i18next"
import { initReactI18next } from "react-i18next"

import en from "@/locales/en.json"
import es from "@/locales/es.json"
import pt from "@/locales/pt.json"

/**
 * Instância de i18n exclusiva dos testes.
 *
 * Não reaproveita `@/lib/i18n` porque aquela lê `localStorage` no import e é
 * um singleton: um teste que trocasse de idioma vazaria para os seguintes na
 * mesma worker. Esta nasce sempre em `pt` e carrega os locales de verdade —
 * assim a asserção é no texto que o usuário vê, e uma chave faltando quebra o
 * teste em vez de passar despercebida.
 */

const testI18n = i18n.createInstance()

await testI18n.use(initReactI18next).init({
  resources: {
    pt: { translation: pt },
    en: { translation: en },
    es: { translation: es },
  },
  lng: "pt",
  fallbackLng: "pt",
  interpolation: { escapeValue: false },
})

export { testI18n }
