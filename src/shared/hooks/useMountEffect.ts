import { useEffect } from "react"

/**
 * Sync único com sistema externo no mount.
 *
 * É a **única** exceção permitida ao banimento de `useEffect` (AGENTS.md §1). Existe para
 * o que o React não modela declarativamente: foco, scroll, `addEventListener`, ciclo de
 * vida de widget de terceiro. Não use para buscar dados (é `useQuery`), derivar valor
 * (compute inline) ou reagir a mudança de prop (é `key` no pai).
 *
 * A ausência de array de dependência é proposital: o callback roda uma vez no mount e o
 * retorno limpa no unmount. Se a sua lógica precisa reagir a uma dependência, ela não
 * pertence aqui.
 */
export function useMountEffect(effect: () => void | (() => void)): void {
  // eslint-disable-next-line react-hooks/exhaustive-deps -- roda uma vez, por contrato
  useEffect(effect, [])
}
