import { useState } from "react"
import { BrandPanel } from "./components/BrandPanel"
import { CadastroType } from "./components/CadastroType"
import { CadastroArquiteto } from "./components/CadastroArquiteto"
import { CadastroCliente } from "./components/CadastroCliente"
import { CadastroEngenheiro } from "./components/CadastroEngenheiro"

type CadastroTypeOption = "arquiteto" | "engenheiro" | "cliente" | null

export function CadastroPage() {
  const [selectedType, setSelectedType] = useState<CadastroTypeOption>(null)

  return (
    <main className="flex h-screen overflow-hidden bg-background">
      <BrandPanel />
      {!selectedType && <CadastroType onTypeSelected={setSelectedType} />}
      {selectedType === "arquiteto" && <CadastroArquiteto />}
      {selectedType === "engenheiro" && <CadastroEngenheiro />}
      {selectedType === "cliente" && <CadastroCliente />}
    </main>
  )
}