import axios from 'axios'
import { useAuthStore } from '@/store/authStore'

export const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_URL ?? '/api/v1',
  withCredentials: true, // needed for refresh token cookie
})

// Attach auth headers on every request
apiClient.interceptors.request.use((config) => {
  const { accessToken, tenantSlug } = useAuthStore.getState()
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`
  if (tenantSlug) config.headers['X-Tenant-Slug'] = tenantSlug
  return config
})

// Silent token refresh on 401
let refreshPromise: Promise<string> | null = null

apiClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config
    if (error.response?.status !== 401 || original._retry) {
      if (error.response?.status === 401) {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
      return Promise.reject(error)
    }

    original._retry = true

    if (!refreshPromise) {
      refreshPromise = axios
        .post('/api/v1/auth/refresh', {}, { withCredentials: true, headers: { 'X-Tenant-Slug': useAuthStore.getState().tenantSlug ?? '' } })
        .then((res: { data: { accessToken: string } }) => {
          useAuthStore.getState().setAccessToken(res.data.accessToken)
          return res.data.accessToken
        })
        .finally(() => { refreshPromise = null })
    }

    const newToken = await refreshPromise
    original.headers.Authorization = `Bearer ${newToken}`
    return apiClient(original)
  },
)
