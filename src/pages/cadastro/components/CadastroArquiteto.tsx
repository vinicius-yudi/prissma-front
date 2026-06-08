import { useTranslation } from "react-i18next"
import { useCadastroArquiteto } from "../hooks/useCadastroArquiteto"
import { CadastroForm } from "./CadastroForm"

interface CadastroArquitetoProps {
  onBack: () => void
}

export function CadastroArquiteto({ onBack }: CadastroArquitetoProps) {
  const { t } = useTranslation()
  const { formDataArquiteto, showPassword, handleChange, handleSubmit, togglePassword, isPending } =
    useCadastroArquiteto()

  return (
    <CadastroForm
      title={t("register.titleArchitect")}
      formData={formDataArquiteto}
      showPassword={showPassword}
      isPending={isPending}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onTogglePassword={togglePassword}
      onBack={onBack}
    />
  )
}
