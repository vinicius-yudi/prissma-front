const BASE_URL = "/api"

type RequestOptions = Omit<RequestInit, "body"> & {
  body?: unknown
  // When true, a 401 does NOT force a logout/redirect — the caller handles the
  // error instead. Use for endpoints that legitimately 401 on authorization
  // (e.g. admin-only listings) so a denied request doesn't end the session.
  skipAuthRedirect?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { skipAuthRedirect, body, ...rest } = options
  const token = localStorage.getItem("token")

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(rest.headers as Record<string, string>),
  }

  const response = await fetch(`${BASE_URL}${path}`, {
    ...rest,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (response.status === 401) {
    const isLoginRoute = path.includes("/login")
    if (!isLoginRoute && !skipAuthRedirect) {
      localStorage.removeItem("token")
      window.location.href = "/login"
      throw new Error("Sessão expirada. Faça login novamente.")
    }
  }

  if (!response.ok) {
  let errorMessage = `Erro ${response.status}`
  const text = await response.text()
  if (text) {
    try {
      const data = JSON.parse(text)
      errorMessage = data.message || text
    } catch {
      errorMessage = text
    }
  }
  throw new Error(errorMessage)
  }

  const contentType = response.headers.get("content-type")
  if (response.status === 204 || !contentType?.includes("application/json")) {
    return undefined as T
  }

  return response.json() as Promise<T>
}

export const api = {
  get: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "GET" }),

  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "POST", body }),

  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PATCH", body }),

  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "PUT", body }),

  delete: <T>(path: string, options?: RequestOptions) =>
    request<T>(path, { ...options, method: "DELETE" }),
}
