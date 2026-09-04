import { tv } from "tailwind-variants"

import logoUrl from "@/assets/svg/logo.svg"

/** Marca das telas públicas: só o ícone — o nome já está no símbolo. */

const lockup = tv({
  base: "flex flex-col items-center",
})

interface BrandProps {
  /** Lado do ícone em px. */
  size?: number
  className?: string
}

export function Brand({ size = 140, className }: BrandProps) {
  return (
    <div className={lockup({ className })}>
      <img
        src={logoUrl}
        alt="PRISSMA"
        className="object-contain"
        style={{ width: size, height: size }}
      />
    </div>
  )
}
