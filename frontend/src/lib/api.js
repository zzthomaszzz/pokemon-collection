const BASE_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000"

// fetch does NOT throw on 401/404/500 — it only throws when the network itself
// fails. So we check response.ok ourselves and raise this instead, which lets
// callers use a normal try/catch and read err.status.
export class ApiError extends Error {
  constructor(message, status, details) {
    super(message)
    this.name = "ApiError"
    this.status = status
    this.details = details
  }
}

// One place that knows the base URL and how to attach the token.
// Change the header format here and every call updates.
export async function apiFetch(path, { token, ...options } = {}) {
  const headers = { "Content-Type": "application/json", ...options.headers }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${BASE_URL}${path}`, { ...options, headers })

  // 204 No Content (logout) has an empty body — response.json() would throw
  if (response.status === 204) {
    return null
  }

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      data?.error ?? `Request failed (${response.status})`,
      response.status,
      data?.details
    )
  }

  return data
}

export function register(name, password) {
  return apiFetch("/users/register", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  })
}

export function login(name, password) {
  return apiFetch("/users/login", {
    method: "POST",
    body: JSON.stringify({ name, password }),
  })
}

export function logout(token) {
  return apiFetch("/users/logout", { method: "POST", token })
}

export function getMe(token) {
  return apiFetch("/users/me", { token })
}
