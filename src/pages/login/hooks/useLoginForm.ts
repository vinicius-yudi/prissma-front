import { useMutation } from "@tanstack/react-query"
import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { toast } from "react-toastify"
import { useAuth } from "@/contexts/AuthContext"
import { login } from "../services/login.service"
import { loginSchema } from "../schemas/login.schema"
import type { LoginFormData } from "../types"

export function useLoginForm() {
	const [formData, setFormData] = useState<LoginFormData>({ email: "", password: "" })
	const [showPassword, setShowPassword] = useState(false)
	const [rememberMe, setRememberMe] = useState(true)
	const { saveToken, logout } = useAuth()
	const navigate = useNavigate()

	const mutation = useMutation({
		mutationFn: login,
		onSuccess: ({ token }) => {
			saveToken(token)
			navigate("/dashboard")
		},
		onError: (error: Error) => {
            const serverMessage =
                (error as { response?: { data?: { message?: string } } }).response?.data?.message ??
                error.message ??
                ""
            if (serverMessage.includes("Invalid credentials")) {
                toast.error("E-mail ou senha incorretos.")
            } else {
                toast.error("Ocorreu um erro ao realizar o login.")
            }
        },
    })

	function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
		const { name, value } = e.target
		setFormData((prev) => ({ ...prev, [name]: value }))
	}

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        const result = loginSchema.safeParse(formData)
        if (!result.success) {
            const fieldErrors = result.error.flatten().fieldErrors
            const firstErrorKey = Object.keys(fieldErrors).find(
                (key) => fieldErrors[key as keyof typeof fieldErrors]?.length
            )
            if (firstErrorKey) {
                const messages = fieldErrors[firstErrorKey as keyof typeof fieldErrors]
                if (messages && messages.length > 0) {
                    toast.error(messages[0])
                }
            }
            return
        }
		logout()
        mutation.mutate(formData)
    }

	function togglePassword() {
		setShowPassword((prev) => !prev)
	}

	function toggleRememberMe() {
		setRememberMe((prev) => !prev)
	}

	return {
		formData,
		showPassword,
		rememberMe,
		handleChange,
		handleSubmit,
		togglePassword,
		toggleRememberMe,
		isPending: mutation.isPending,
	}
}
