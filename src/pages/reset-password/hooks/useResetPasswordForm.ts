import { useMutation } from "@tanstack/react-query"
import { useEffect, useState } from "react"
import { useNavigate, useSearchParams } from "react-router-dom"
import { toast } from "react-toastify"
import { resetPassword } from "../services/reset-password.service"

export function useResetPasswordForm() {
	const [searchParams] = useSearchParams()
	const token = searchParams.get("token") ?? ""
	const navigate = useNavigate()

	useEffect(() => {
		if (!token) {
			navigate("/forgot-password", { replace: true })
		}
	}, [token, navigate])

	const [newPassword, setNewPassword] = useState("")
	const [confirmPassword, setConfirmPassword] = useState("")
	const [showPassword, setShowPassword] = useState(false)
	const [showConfirm, setShowConfirm] = useState(false)

	const mutation = useMutation({
		mutationFn: () => resetPassword(token, newPassword),
		onSuccess: () => {
			toast.success("Senha redefinida com sucesso!")
			navigate("/login")
		},
		onError: (error: Error) => {
			toast.error(error.message)
		},
	})

	function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
		e.preventDefault()
		if (!token) {
			toast.error("Token inválido ou ausente.")
			return
		}
		if (!/[A-Z]/.test(newPassword)) {
			toast.warning("A senha deve conter pelo menos uma letra maiúscula.")
			return
		}
		if (!/[a-z]/.test(newPassword)) {
			toast.warning("A senha deve conter pelo menos uma letra minúscula.")
			return
		}
		if (!/[0-9]/.test(newPassword)) {
			toast.warning("A senha deve conter pelo menos um número.")
			return
		}
		if (!/[^a-zA-Z0-9]/.test(newPassword)) {
			toast.warning("A senha deve conter pelo menos um caractere especial.")
			return
		}
		if (newPassword !== confirmPassword) {
			toast.warning("As senhas não coincidem.")
			return
		}
		mutation.mutate()
	}

	return {
		newPassword,
		setNewPassword,
		confirmPassword,
		setConfirmPassword,
		showPassword,
		togglePassword: () => setShowPassword((p) => !p),
		showConfirm,
		toggleConfirm: () => setShowConfirm((p) => !p),
		handleSubmit,
		isPending: mutation.isPending,
	}
}
