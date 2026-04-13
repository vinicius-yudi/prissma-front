import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { cadastroArquiteto } from "../services/cadastroArquiteto.service"
import type { CadastroFormDataArquiteto } from "../types"

export function useCadastroForm() {
  const [formDataArquiteto, setFormData] = useState<CadastroFormDataArquiteto>({ email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)

  const mutation = useMutation({
    mutationFn: cadastroArquiteto,
    onSuccess: () => {
      // TODO: realizar cadastro e redirecionar para dashboard
    },
    onError: (error: Error) => {
      console.error(error.message)
    },
  })

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    mutation.mutate(formDataArquiteto)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataArquiteto,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  }
}
