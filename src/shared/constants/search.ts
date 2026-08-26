/**
 * Nome do parâmetro de busca na URL.
 *
 * Mora fora dos componentes porque quem escreve (<HeaderSearch>, no header) e
 * quem lê (`useProjects`, na página de obras) não se conhecem — a URL é o único
 * contrato entre os dois.
 */
export const SEARCH_PARAM = "q"
