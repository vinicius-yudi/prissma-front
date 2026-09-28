/**
 * Blob → `data:` URL.
 *
 * A alternativa seria `URL.createObjectURL`, mas ela devolve um recurso que
 * alguém precisa revogar, e o dono natural desse ciclo — o cache do TanStack
 * Query — não tem gancho de destruição. Uma string não tem ciclo de vida: some
 * junto com a entrada do cache.
 */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(reader.error ?? new Error("FileReader falhou"))
    reader.readAsDataURL(blob)
  })
}
