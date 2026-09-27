interface AttachmentImageProps {
  blob: Blob
  alt: string
  className?: string
}

/**
 * `<img>` de um `Blob`. A URL `blob:` é criada quando o elemento entra no DOM
 * e revogada quando ele sai — pelo ref com limpeza do React 19, sem
 * `useEffect` nem estado. Cada montagem ganha a própria URL, então o
 * duplo-mount do StrictMode não revoga uma URL ainda em uso.
 */
export function AttachmentImage({ blob, alt, className }: AttachmentImageProps) {
  function attach(img: HTMLImageElement | null) {
    if (!img) return undefined
    const url = URL.createObjectURL(blob)
    img.src = url
    return () => URL.revokeObjectURL(url)
  }

  return <img ref={attach} alt={alt} className={className} />
}
