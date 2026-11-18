import axios from 'axios'

export const baseURL = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const apiClient = axios.create({
    baseURL,
    timeout: 180_000,
    withCredentials: true,
    headers: {
        Accept: 'application/json',
        'X-Requested-With': 'XMLHttpRequest'
    }
})

let unauthorizedHandler: (() => void) | null = null

export const setUnauthorizedHandler = (handler: () => void) => {
    unauthorizedHandler = handler
}

apiClient.interceptors.response.use(
    (response) => response,
    (error: unknown) => {
        if (
            axios.isAxiosError(error) &&
            error.response?.status === 401 &&
            !error.config?.url?.includes('/api/auth/')
        ) {
            unauthorizedHandler?.()
        }
        return Promise.reject(error)
    }
)

export const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback

    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (error.code === 'ECONNABORTED') return 'The server did not respond within 180 seconds.'
    if (!error.response) return 'The backend could not be reached.'

    return `${fallback} (HTTP ${error.response.status})`
}
