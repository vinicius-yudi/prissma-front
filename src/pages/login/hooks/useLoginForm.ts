import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/AuthContext"
import { login } from "../services/login.service"
import type { LoginFormData } from "../types"

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validate(formData: LoginFormData): string | null {
	if (!formData.email.trim()) return "O e-mail é obrigatório."
	if (!EMAIL_REGEX.test(formData.email)) return "Informe um e-mail válido."
	if (!formData.password) return "A senha é obrigatória."
	if (formData.password.length < 6) return "A senha deve ter no mínimo 6 caracteres."
	return null
}

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
			toast.error(error.message)
		},
	})

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		const error = validate(formData)
		if (error) {
			toast.warning(error)
			return
		}
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
	}
}
