import { act, renderHook } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { useCepLookup } from "../useCepLookup"

/**
 * A consulta ao ViaCEP é debounced em 500 ms: o CEP é digitado dígito a
 * dígito, e disparar a cada tecla renderia oito requests por endereço. Os
 * temporizadores falsos são o que torna esse atraso testável sem esperar meio
 * segundo real por caso.
 */

const ENDERECO = {
  logradouro: "Avenida Paulista",
  bairro: "Bela Vista",
  localidade: "São Paulo",
  uf: "SP",
}

const fetchMock = vi.fn()

beforeEach(() => {
  vi.useFakeTimers()
  fetchMock.mockReset()
  vi.stubGlobal("fetch", fetchMock)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllGlobals()
})

function jsonOk(body: unknown) {
  return Promise.resolve({ json: () => Promise.resolve(body) } as Response)
}

/**
 * Avança o debounce e deixa as promises pendentes resolverem.
 *
 * Deliberadamente sem esperar por asserção: esse tipo de espera roda em tempo
 * REAL, e com temporizadores falsos nada avança sozinho — o teste ficaria
 * parado até estourar o timeout. O `act` já drena a fila de microtasks, então
 * a asserção pode vir logo depois.
 */
async function passarDebounce() {
  await act(async () => {
    vi.advanceTimersByTime(500)
    await Promise.resolve()
    await Promise.resolve()
  })
}

describe("useCepLookup — quando não consulta", () => {
  it("não busca com CEP incompleto", async () => {
    renderHook(() => useCepLookup("0131010"))

    await passarDebounce()

    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("não busca com CEP vazio", async () => {
    const { result } = renderHook(() => useCepLookup(""))

    await passarDebounce()

    expect(fetchMock).not.toHaveBeenCalled()
    expect(result.current.cepData).toBeNull()
    expect(result.current.isLookingUp).toBe(false)
  })

  // O campo é mascarado na tela ("01310-100"), então a contagem tem de ser
  // feita sobre os dígitos, não sobre o texto.
  it("conta só os dígitos, ignorando a máscara", async () => {
    renderHook(() => useCepLookup("01310-100"))

    await passarDebounce()

    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/01310100/json/")
  })

  // Apagar um dígito de um CEP já resolvido precisa limpar o endereço, senão
  // o formulário fica preenchido com o endereço do CEP anterior.
  it("limpa o resultado quando o CEP deixa de estar completo", async () => {
    fetchMock.mockReturnValue(jsonOk(ENDERECO))
    const { result, rerender } = renderHook(({ cep }) => useCepLookup(cep), {
      initialProps: { cep: "01310100" },
    })
    await passarDebounce()
    expect(result.current.cepData).toEqual(ENDERECO)

    rerender({ cep: "0131010" })

    expect(result.current.cepData).toBeNull()
    expect(result.current.cepError).toBeNull()
  })
})

describe("useCepLookup — debounce", () => {
  it("não dispara antes dos 500 ms", () => {
    renderHook(() => useCepLookup("01310100"))

    act(() => {
      vi.advanceTimersByTime(499)
    })

    expect(fetchMock).not.toHaveBeenCalled()
  })

  // O ponto do debounce: digitar o CEP inteiro é uma request, não várias.
  it("faz uma única busca quando o CEP muda várias vezes seguidas", async () => {
    fetchMock.mockReturnValue(jsonOk(ENDERECO))
    const { rerender } = renderHook(({ cep }) => useCepLookup(cep), {
      initialProps: { cep: "01310100" },
    })

    act(() => vi.advanceTimersByTime(200))
    rerender({ cep: "01310101" })
    act(() => vi.advanceTimersByTime(200))
    rerender({ cep: "01310102" })
    await passarDebounce()

    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(fetchMock).toHaveBeenCalledWith("https://viacep.com.br/ws/01310102/json/")
  })
})

describe("useCepLookup — resultado", () => {
  it("preenche o endereço quando o CEP existe", async () => {
    fetchMock.mockReturnValue(jsonOk(ENDERECO))
    const { result } = renderHook(() => useCepLookup("01310100"))

    await passarDebounce()

    expect(result.current.cepData).toEqual(ENDERECO)
    expect(result.current.cepError).toBeNull()
    expect(result.current.isLookingUp).toBe(false)
  })

  // O ViaCEP responde 200 com `{ erro: true }` para CEP inexistente — não é um
  // erro de HTTP, então sem esta checagem o formulário aceitaria um endereço
  // vazio como válido.
  it("acusa CEP inexistente, que vem com status 200", async () => {
    fetchMock.mockReturnValue(jsonOk({ erro: true }))
    const { result } = renderHook(() => useCepLookup("99999999"))

    await passarDebounce()

    expect(result.current.cepError).toBe("CEP não encontrado")
    expect(result.current.cepData).toBeNull()
  })

  it("acusa falha de rede", async () => {
    fetchMock.mockRejectedValue(new Error("offline"))
    const { result } = renderHook(() => useCepLookup("01310100"))

    await passarDebounce()

    expect(result.current.cepError).toBe("Erro ao buscar CEP")
    expect(result.current.isLookingUp).toBe(false)
  })

  it("sinaliza a busca em andamento", async () => {
    fetchMock.mockReturnValue(new Promise(() => {}))
    const { result } = renderHook(() => useCepLookup("01310100"))

    await passarDebounce()

    expect(result.current.isLookingUp).toBe(true)
  })

  // Resposta que chega depois do desmonte não pode chamar `setState`: além do
  // aviso do React, ela sobrescreveria o endereço de outro formulário.
  it("descarta a resposta que chega depois do desmonte", async () => {
    let responder: (v: unknown) => void = () => {}
    fetchMock.mockReturnValue(
      new Promise((resolve) => {
        responder = () => resolve({ json: () => Promise.resolve(ENDERECO) } as Response)
      }),
    )
    const { unmount } = renderHook(() => useCepLookup("01310100"))
    await passarDebounce()

    unmount()
    await act(async () => responder(null))

    // Chegar até aqui sem aviso de "setState em componente desmontado" é o
    // próprio resultado do teste.
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })
})
