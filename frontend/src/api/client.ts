import axios, { AxiosError, type InternalAxiosRequestConfig } from 'axios'
import { tokenStore } from '@/lib/token-store'

export const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000'

export const api = axios.create({ baseURL: API_URL })

// Instância separada sem interceptors — usada só pra /auth/refresh, pra não entrar em loop.
const rawApi = axios.create({ baseURL: API_URL })

api.interceptors.request.use((config) => {
  const token = tokenStore.getAccessToken()
  if (token) {
    config.headers = config.headers ?? {}
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

let refreshPromise: Promise<string | null> | null = null

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = tokenStore.getRefreshToken()
  if (!refreshToken) return null

  try {
    const { data } = await rawApi.post<{ accessToken: string; refreshToken: string }>('/auth/refresh', {
      refreshToken,
    })
    tokenStore.setAccessToken(data.accessToken)
    tokenStore.setRefreshToken(data.refreshToken)
    return data.accessToken
  } catch {
    tokenStore.clear()
    return null
  }
}

interface RetriableConfig extends InternalAxiosRequestConfig {
  _retried?: boolean
}

api.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const config = error.config as RetriableConfig | undefined
    const status = error.response?.status
    const isAuthEndpoint = config?.url?.startsWith('/auth/')

    if (status === 401 && config && !config._retried && !isAuthEndpoint) {
      config._retried = true
      refreshPromise ??= refreshAccessToken().finally(() => {
        refreshPromise = null
      })
      const newToken = await refreshPromise
      if (newToken) {
        config.headers = config.headers ?? {}
        config.headers.Authorization = `Bearer ${newToken}`
        return api(config)
      }
    }

    return Promise.reject(error)
  },
)

export { refreshAccessToken }
