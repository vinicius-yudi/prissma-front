import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cadastroArquiteto } from "../services/cadastroArquiteto.service"
import type { CadastroFormDataArquiteto } from "../types"

export function useCadastroArquiteto() {
  const [formDataArquiteto, setFormData] = useState<CadastroFormDataArquiteto>({ email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroArquiteto,
    onSuccess: ({ token }) => {
      saveToken(token)
      navigate("/dashboard")
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
    if (formDataArquiteto.password !== formDataArquiteto.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }
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