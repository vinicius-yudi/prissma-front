import { Search, X } from "lucide-react"
import { useState } from "react"
import type { ChangeEvent, FormEvent } from "react"
import { useTranslation } from "react-i18next"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"

import { SEARCH_PARAM } from "@/shared/constants/search"

const OBRAS_PATH = "/obras"

function SearchField() {
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [searchParams, setSearchParams] = useSearchParams()

  const isOnObras = pathname === OBRAS_PATH
  const urlTerm = searchParams.get(SEARCH_PARAM) ?? ""

  // Em /obras o valor exibido É a URL — sem cópia local, não há o que
  // sincronizar quando o termo muda por fora (voltar do navegador, link
  // colado). Fora de /obras não há lista para filtrar em tempo real, então o
  // que se digita fica local até o Enter.
  const [draft, setDraft] = useState("")
  const term = isOnObras ? urlTerm : draft

  function setTerm(value: string) {
    if (!isOnObras) {
      setDraft(value)
      return
    }
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (value) next.set(SEARCH_PARAM, value)
        else next.delete(SEARCH_PARAM)
        return next
      },
      // Sem `replace` cada tecla vira uma entrada de histórico, e o botão
      // voltar passaria a desfazer a busca letra por letra.
      { replace: true },
    )
  }

  function handleChange(e: ChangeEvent<HTMLInputElement>) {
    setTerm(e.target.value)
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (isOnObras) return
    const query = term ? `?${SEARCH_PARAM}=${encodeURIComponent(term)}` : ""
    navigate(`${OBRAS_PATH}${query}`)
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="relative min-w-0 flex-1 sm:max-w-sm">
      <Search
        size={15}
        className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant"
      />
      <input
        type="search"
        value={term}
        onChange={handleChange}
        placeholder={t("header.search")}
        aria-label={t("header.search")}
        // `text-base` no celular: abaixo de 16px o Safari do iOS dá zoom na
        // página ao focar o campo, e o layout não volta sozinho.
        className="w-full min-h-11 rounded-full border border-outline-variant bg-surface-container py-2 pl-9 pr-9 text-base text-on-surface placeholder:text-on-surface-faint focus:outline-none focus:ring-2 focus:ring-primary/40 sm:min-h-0 sm:text-sm [&::-webkit-search-cancel-button]:appearance-none"
      />
      {term && (
        <button
          type="button"
          onClick={() => setTerm("")}
          aria-label={t("header.searchClear")}
          className="absolute right-2 top-1/2 -translate-y-1/2 cursor-pointer rounded-full p-1 text-on-surface-variant transition-colors hover:bg-surface-container-high hover:text-on-surface"
        >
          <X size={14} />
        </button>
      )}
    </form>
  )
}

/**
 * Busca de obras, no header.
 *
 * O termo mora na URL (`/obras?q=…`), não num estado de página: assim o header
 * consegue escrevê-lo sem conhecer a lista, a lista lê de uma fonte só, e o
 * resultado filtrado sobrevive ao recarregar e vai por link.
 *
 * A chave por rota descarta o que ficou digitado ao trocar de tela — um termo
 * datilografado no Dashboard e nunca submetido não deve ressurgir depois.
 */
export function HeaderSearch() {
  const { pathname } = useLocation()
  return <SearchField key={pathname} />
}
