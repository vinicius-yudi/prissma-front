import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import { PROPOSTA_FORM_DEFAULTS, propostaSchema, type PropostaFormData } from "../schemas/propostaSchema"
import { usePropostas } from "./usePropostas"

export interface UsePropostaFormResult {
  form: UseFormReturn<PropostaFormData>
  file: File | null
  /** Valida antes de guardar; devolve `false` quando recusou (o motivo sai em toast). */
  pickFile: (file: File | null) => boolean
  handleSave: () => void
  isSaving: boolean
}

/**
 * "+ Nova proposta". A imagem é opcional — a proposta pode nascer só com nome
 * e ambiente e receber a imagem pela prévia da IA. Quem numera a versão é o
 * servidor. Valores iniciais no mount: quem abre troca a `key`.
 */
export function usePropostaForm(projectId: number, onSaved: () => void): UsePropostaFormResult {
  const { createAsync, isCreating, validateImage } = usePropostas(projectId)
  const form = useForm<PropostaFormData>({ resolver: zodResolver(propostaSchema), defaultValues: PROPOSTA_FORM_DEFAULTS })
  const [file, setFile] = useState<File | null>(null)

  async function save(data: PropostaFormData) {
    try {
      await createAsync({
        payload: { title: data.title.trim(), description: data.description?.trim() || null, environmentType: data.environmentType },
        file,
      })
      onSaved()
    } catch {
      // O toast de erro sai do hook de mutation; o modal fica aberto.
    }
  }

  return {
    form,
    file,
    pickFile: (next) => {
      const accepted = !next || validateImage(next)
      setFile(accepted ? next : null)
      return accepted
    },
    handleSave: () => void form.handleSubmit(save)(),
    isSaving: isCreating,
  }
}
