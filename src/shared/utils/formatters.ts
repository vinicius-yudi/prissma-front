import { EXTENSION_PATTERN } from "./regex"

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("pt-BR")
}

export function stripExtension(fileName: string): string {
  return fileName.replace(EXTENSION_PATTERN, "")
}
