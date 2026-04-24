import { DotLottieReact } from "@lottiefiles/dotlottie-react"
import homeLottie from "#/assets/lotties/Home.lottie?url"

export function BrandPanel() {
  return (
    <section
      className="hidden lg:flex lg:w-[55%] h-full relative flex-col justify-between p-16 overflow-hidden"
      style={{ backgroundColor: "#0d1f20" }}
    >
      {/* Blueprint grid */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `
            linear-gradient(to right, rgba(1, 83, 76, 0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(1, 83, 76, 0.05) 1px, transparent 1px)
          `,
          backgroundSize: "40px 40px",
        }}
      />

      {/* Headline */}
      <div className="z-10">
        <h1 className="text-white text-4xl font-bold">
          Controle total de suas obras
        </h1>
      </div>

      {/* Hero visual */}
      <div className="relative flex-1 flex items-center justify-center">
        <div className="relative w-full h-full z-10">
          <DotLottieReact src={homeLottie} loop autoplay className="w-full h-full" />
        </div>
      </div>

      {/* Tagline */}
      <div className="z-10 text-right">
        <p className="text-white text-4xl font-bold">
          Do orçamento inicial à entrega das chaves.
        </p>
      </div>

      {/* Light leak */}
      <div
        className="absolute bottom-0 left-0 w-full h-1/2 pointer-events-none"
        style={{ background: "linear-gradient(to top, rgba(1, 83, 76, 0.1), transparent)" }}
      />
    </section>
  )
}
