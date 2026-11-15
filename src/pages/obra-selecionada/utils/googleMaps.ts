import type { Project } from "@/shared/types/project"

type AddressFields = Pick<Project, "address" | "street" | "number" | "neighborhood" | "city" | "state" | "zipCode">

/**
 * Endereço para o geocoder do Google. O complemento fica de fora de propósito:
 * "apto 12", "bloco B" confundem a busca e não mudam o ponto no mapa.
 */
export function mapsQuery(project: AddressFields): string {
  if (!project.street) return project.address?.trim() ?? ""
  return [project.street, project.number, project.neighborhood, project.city, project.state, project.zipCode]
    .filter(Boolean)
    .join(", ")
}

/** Maps URLs oficiais: não exigem chave e, no celular, abrem o app do Maps. */
export function mapsSearchUrl(query: string): string {
  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`
}

/** Rota a partir da posição atual do usuário até a obra. */
export function mapsDirectionsUrl(query: string): string {
  return `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(query)}`
}


/** Embed sem chave de API; a Maps Embed API oficial exigiria uma. */
export function mapsEmbedUrl(query: string, language: string): string {
  return `https://maps.google.com/maps?q=${encodeURIComponent(query)}&hl=${language}&z=15&output=embed`
}
