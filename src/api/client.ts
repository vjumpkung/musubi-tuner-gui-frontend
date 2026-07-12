import axios from 'axios'

const baseURL = String(import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '')

export const apiClient = axios.create({
    baseURL,
    timeout: 180_000,
    headers: {
        Accept: 'application/json'
    }
})

export const getApiErrorMessage = (error: unknown, fallback: string) => {
    if (!axios.isAxiosError(error)) return error instanceof Error ? error.message : fallback

    const detail = error.response?.data?.detail
    if (typeof detail === 'string' && detail.trim()) return detail
    if (error.code === 'ECONNABORTED') return 'The server did not respond within 180 seconds.'
    if (!error.response) return 'The backend could not be reached.'

    return `${fallback} (HTTP ${error.response.status})`
}
