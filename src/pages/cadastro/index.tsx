import { BrandPanel } from "./components/BrandPanel"
import { CadastroType } from "./components/CadastroType"
import { CadastroArquiteto } from "./components/CadastroArquiteto"

export function CadastroPage() {
  return (
    <main className="flex min-h-screen" style={{ backgroundColor: "#041617" }}>
      <BrandPanel />
      <CadastroType />
      {/* <CadastroArquiteto /> */}
    </main>
  )
}