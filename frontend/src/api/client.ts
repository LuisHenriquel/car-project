import type { Project, SaveProjectRequest, Vehicle } from './types'

const BASE = import.meta.env.VITE_API_URL ?? ''

export class ApiError extends Error {
  readonly status: number
  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...init?.headers },
  })
  if (!res.ok) {
    throw new ApiError(res.status, `${init?.method ?? 'GET'} ${path} falhou (${res.status})`)
  }
  if (res.status === 204) return undefined as T
  return (await res.json()) as T
}

export const api = {
  listVehicles: () => request<Vehicle[]>('/api/vehicles'),
  getProject: (id: string) => request<Project>(`/api/projects/${id}`),
  createProject: (body: SaveProjectRequest) =>
    request<Project>('/api/projects', { method: 'POST', body: JSON.stringify(body) }),
  updateProject: (id: string, body: SaveProjectRequest) =>
    request<Project>(`/api/projects/${id}`, { method: 'PUT', body: JSON.stringify(body) }),
}
