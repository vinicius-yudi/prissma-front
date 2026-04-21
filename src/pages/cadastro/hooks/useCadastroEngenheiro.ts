import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { cadastroEngenheiro } from "../services/cadastroEngenheiro.service"
import type { CadastroFormDataEngenheiro } from "../types"

export function useCadastroEngenheiro() {
  const [formDataEngenheiro, setFormData] = useState<CadastroFormDataEngenheiro>({ email: "", password: "", confirmPassword: "" })
  const [showPassword, setShowPassword] = useState(false)
  const navigate = useNavigate()
  const { saveToken } = useAuth()

  const mutation = useMutation({
    mutationFn: cadastroEngenheiro,
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
    if (formDataEngenheiro.password !== formDataEngenheiro.confirmPassword) {
      alert("As senhas não coincidem")
      return
    }
    mutation.mutate(formDataEngenheiro)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formDataEngenheiro,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  }
}