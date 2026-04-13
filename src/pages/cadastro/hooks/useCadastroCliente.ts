import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cadastroCliente } from "../services/cadastroCliente.service"
import type { CadastroFormDataCliente } from "../types"

export function useCadastroCliente() {
  const [formDataCliente, setFormData] = useState<CadastroFormDataCliente>({ email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroCliente,
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
    if (formDataCliente.password !== formDataCliente.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }
    mutation.mutate(formDataCliente)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataCliente,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  }
}