import axios from 'axios'

// In dev, Vite proxies /api to the backend (see vite.config.js).
// For a split deployment (e.g. frontend on Vercel, backend on Render),
// set VITE_API_BASE_URL in the frontend's .env to the backend's full /api URL.
const baseURL = import.meta.env.VITE_API_BASE_URL || '/api'

// Same-origin path for uploaded files (photos, attachments), independent of the /api prefix.
export const uploadsBase = baseURL.replace(/\/api\/?$/, '/uploads')

const api = axios.create({ baseURL })

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('nawi_token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err?.response?.status === 401) {
      localStorage.removeItem('nawi_token')
      localStorage.removeItem('nawi_user')
      if (!window.location.pathname.startsWith('/login')) {
        window.location.href = '/login'
      }
    }
    return Promise.reject(err)
  }
)

export default api
