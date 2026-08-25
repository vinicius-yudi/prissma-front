import logoUrl from "@/assets/logo.png"
import wordmarkUrl from "@/assets/logo-wordmark.png"

/**
 * Lockup da marca: ícone + wordmark.
 *
 * A logo antiga era um SVG em teal com o wordmark embutido — sobrou da
 * identidade anterior e era a única peça das telas públicas ainda fora da
 * paleta Barroco ouro.
 *
 * O wordmark tem proporção fixa de ~4,16:1, então a largura sai do tamanho do
 * ícone em vez de ser fixada à mão: mudar `size` mantém o lockup proporcional.
 */

const WORDMARK_RATIO = 512 / 123

interface BrandProps {
  /** Lado do ícone em px. O wordmark acompanha. */
  size?: number
  className?: string
}

export function Brand({ size = 72, className = "" }: BrandProps) {
  const wordmarkWidth = Math.round(size * 2.4)

  return (
    <div className={`flex flex-col items-center gap-3 ${className}`}>
      <img
        src={logoUrl}
        alt=""
        aria-hidden
        className="rounded-2xl object-contain"
        style={{ width: size, height: size }}
      />
      <img
        src={wordmarkUrl}
        alt="PRISSMA"
        className="object-contain"
        style={{ width: wordmarkWidth, height: Math.round(wordmarkWidth / WORDMARK_RATIO) }}
      />
    </div>
  )
}
