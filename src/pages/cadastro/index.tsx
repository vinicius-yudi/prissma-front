import { useState } from "react"
import { ConstructionHero } from "@/pages/login/components/ConstructionHero"
import { CadastroArquiteto } from "./components/CadastroArquiteto"
import { CadastroCliente } from "./components/CadastroCliente"
import { CadastroEngenheiro } from "./components/CadastroEngenheiro"
import { CadastroType } from "./components/CadastroType"
import "@/pages/login/login.css"

type CadastroTypeOption = "arquiteto" | "engenheiro" | "cliente" | null

export function CadastroPage() {
  const [selectedType, setSelectedType] = useState<CadastroTypeOption>(null)

  function handleBack() {
    setSelectedType(null)
  }

  return (
    <main className="bf-login flex h-screen w-full overflow-hidden bg-[#020617]">
      <ConstructionHero mirror />
      {!selectedType && <CadastroType onTypeSelected={setSelectedType} />}
      {selectedType === "arquiteto" && <CadastroArquiteto onBack={handleBack} />}
      {selectedType === "engenheiro" && <CadastroEngenheiro onBack={handleBack} />}
      {selectedType === "cliente" && <CadastroCliente onBack={handleBack} />}
    </main>
  )
}
