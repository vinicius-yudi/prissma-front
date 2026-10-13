import { zodResolver } from "@hookform/resolvers/zod"
import { useState } from "react"
import { useForm } from "react-hook-form"
import type { UseFormReturn } from "react-hook-form"

import type { Attachment } from "@/shared/types/attachment"

import { DIARY_TYPE } from "../constants/diario"
import { diarioSchema, type DiarioFormData } from "../schemas/diario.schema"
import type { CreateDiarioEntryRequest } from "../types/diario"
import { nowForInput } from "../utils/diarioGroups"
import type { UploadInput } from "./useAttachments"

interface MutateOptions<T> {
  onSuccess?: (data: T) => void
}

interface UseDiarioComposerArgs {
  create: (payload: CreateDiarioEntryRequest, options?: MutateOptions<unknown>) => void
  upload: (input: UploadInput, options?: MutateOptions<Attachment>) => void
}

export interface UseDiarioComposerResult {
  form: UseFormReturn<DiarioFormData>
  /** Foto já enviada, aguardando o registro. */
  attachment: Pick<Attachment, "id" | "fileName"> | null
  handleAttach: (file: File) => void
  clearAttachment: () => void
  handleSave: () => void
}

function blank(entryType: DiarioFormData["entryType"]): DiarioFormData {
  return { entryType, description: "", entryDate: nowForInput() }
}

/**
 * Compositor do diário: tipo, texto, data/hora e uma foto opcional. A foto
 * sobe antes (o backend liga o registro a um anexo existente). Depois de
 * registrar, o texto limpa e o tipo fica — quem lança efetivo costuma lançar
 * vários seguidos.
 */
export function useDiarioComposer({ create, upload }: UseDiarioComposerArgs): UseDiarioComposerResult {
  const form = useForm<DiarioFormData>({ resolver: zodResolver(diarioSchema), defaultValues: blank(DIARY_TYPE.WORKFORCE) })
  const [attachment, setAttachment] = useState<Pick<Attachment, "id" | "fileName"> | null>(null)

  function save(data: DiarioFormData) {
    const payload: CreateDiarioEntryRequest = {
      entryType: data.entryType,
      description: data.description.trim(),
      entryDate: new Date(data.entryDate).toISOString(),
      attachmentId: attachment?.id ?? null,
    }
    create(payload, {
      onSuccess: () => {
        form.reset(blank(data.entryType))
        setAttachment(null)
      },
    })
  }

  return {
    form,
    attachment,
    handleAttach: (file) => upload({ file }, { onSuccess: (uploaded) => setAttachment({ id: uploaded.id, fileName: uploaded.fileName }) }),
    clearAttachment: () => setAttachment(null),
    handleSave: () => void form.handleSubmit(save)(),
  }
}
