import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import homeLottie from "#/assets/lotties/Home.lottie?url"

export function BrandPanel() {
  return (
    <section
      className="hidden lg:flex lg:w-[55%] h-full relative flex-col justify-between p-16 overflow-hidden"
      style={{ backgroundColor: "#080D0E" }}
    >
      {/* Grid pattern */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(249, 115, 22, 0.06) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(249, 115, 22, 0.06) 1px, transparent 1px)
          `,
          backgroundSize: "48px 48px",
        }}
      />

      {/* Orange glow top-left */}
      <div
        className="absolute top-0 left-0 pointer-events-none"
        style={{
          width: "480px",
          height: "480px",
          background: "radial-gradient(circle, rgba(249,115,22,0.12) 0%, transparent 70%)",
        }}
      />

      {/* Headline */}
      <div className="z-10">
        <span className="inline-block text-xs font-semibold tracking-widest uppercase text-primary mb-4">
          PRISSMA
        </span>
        <h1 className="text-white text-4xl font-bold leading-tight">
          Controle total<br />
          <span style={{ color: "#F97316" }}>de suas obras.</span>
        </h1>
      </div>

      {/* Hero visual */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full h-full z-10">
          <DotLottieReact src={homeLottie} loop autoplay className="w-full h-full" />
        </div>
      </div>

      {/* Tagline */}
      <div className="z-10">
        <p className="text-on-surface-variant text-lg font-medium leading-snug">
          Do orçamento inicial
        </p>
        <p className="text-white text-2xl font-bold">
          à entrega das chaves.
        </p>
      </div>

      {/* Bottom gradient */}
      <div
        className="absolute bottom-0 left-0 w-full h-1/3 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(249, 115, 22, 0.07), transparent)" }}
      />
    </section>
  )
}
