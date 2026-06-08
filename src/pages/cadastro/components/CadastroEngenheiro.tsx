import { useTranslation } from "react-i18next"
import { useCadastroEngenheiro } from "../hooks/useCadastroEngenheiro"
import { CadastroForm } from "./CadastroForm"

interface CadastroEngenheiroProps {
  onBack: () => void
}

export function CadastroEngenheiro({ onBack }: CadastroEngenheiroProps) {
  const { t } = useTranslation()
  const { formDataEngenheiro, showPassword, handleChange, handleSubmit, togglePassword, isPending } =
    useCadastroEngenheiro()

  return (
    <CadastroForm
      title={t("register.titleEngineer")}
      formData={formDataEngenheiro}
      showPassword={showPassword}
      isPending={isPending}
      onChange={handleChange}
      onSubmit={handleSubmit}
      onTogglePassword={togglePassword}
      onBack={onBack}
    />
  )
}
