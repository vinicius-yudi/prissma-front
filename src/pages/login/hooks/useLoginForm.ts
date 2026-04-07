import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "@/contexts/AuthContext"
import { login } from "../services/login.service"
import type { LoginFormData } from "../types"

export function useLoginForm() {
  const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
  const [showPassword, setShowPassword] = useState(false)
  const { saveToken } = useAuth()
  const navigate = useNavigate()

  const mutation = useMutation({
    mutationFn: login,
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
    mutation.mutate(formData)
  }

  function togglePassword() {
    setShowPassword((prev) => !prev)
  }

  return {
    formData,
    showPassword,
    handleChange,
    handleSubmit,
    togglePassword,
    isPending: mutation.isPending,
    isError: mutation.isError,
    errorMessage: mutation.error?.message,
  }
}
