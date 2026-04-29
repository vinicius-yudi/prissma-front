import { useEffect, useRef, useState } from "react"

export interface CepData {
  logradouro: string
  bairro: string
  localidade: string
  uf: string
}

interface UseCepLookupReturn {
  cepData: CepData | null
  isLookingUp: boolean
  cepError: string | null
}

export function useCepLookup(cep: string): UseCepLookupReturn {
  const [cepData, setCepData] = useState<CepData | null>(null)
  const [isLookingUp, setIsLookingUp] = useState(false)
  const [cepError, setCepError] = useState<string | null>(null)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const digits = cep.replace(/\D/g, "")

    if (digits.length !== 8) {
      setCepData(null)
      setCepError(null)
      setIsLookingUp(false)
      return
    }

    if (timerRef.current) clearTimeout(timerRef.current)

    let cancelled = false

    timerRef.current = setTimeout(async () => {
      setIsLookingUp(true)
      setCepError(null)
      try {
        const res = await fetch(`https://viacep.com.br/ws/${digits}/json/`)
        const json = await res.json()
        if (cancelled) return
        if (json.erro) {
          setCepError("CEP não encontrado")
          setCepData(null)
        } else {
          setCepData(json as CepData)
        }
      } catch {
        if (!cancelled) setCepError("Erro ao buscar CEP")
      } finally {
        if (!cancelled) setIsLookingUp(false)
      }
    }, 500)

    return () => {
      cancelled = true
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [cep])

  return { cepData, isLookingUp, cepError }
}
