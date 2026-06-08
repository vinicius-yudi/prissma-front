import { useTranslation } from "react-i18next"
import { useCadastroCliente } from "../hooks/useCadastroCliente"
import { CadastroForm } from "./CadastroForm"

interface CadastroClienteProps {
  onBack: () => void
}

export function CadastroCliente({ onBack }: CadastroClienteProps) {
  const { t } = useTranslation()
  const { formDataCliente, showPassword, handleChange, handleSubmit, togglePassword, isPending } =
    useCadastroCliente()

  return (
    <CadastroForm
      title={t("register.titleClient")}
      formData={formDataCliente}
      showPassword={showPassword}
      isPending={isPending}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onTogglePassword={togglePassword}
      onBack={onBack}
    />
  )
}
