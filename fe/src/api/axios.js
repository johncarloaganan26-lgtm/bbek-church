import axios from 'axios'
import { ElMessage } from 'element-plus'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'

// Vite environment configuration for API URL
// Development: '/api' is proxied by Vite dev server (configured in vite.config.js)
// Production: Must set VITE_API_URL environment variable (e.g., in Vercel settings)
// Helper to clean and format the API URL
const formatBaseUrl = () => {
  if (!import.meta.env.PROD) return '' // In dev, we use relative paths handled by Vite proxy
  
  const baseUrl = import.meta.env.VITE_API_URL
  if (!baseUrl) return ''
  
  // Return just the domain root, trailing slash removed
  return baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl
}

const BASE_URL = formatBaseUrl()

// Log configuration for debugging
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_API_URL) {
    console.error('❌ VITE_API_URL not set in production!')
    console.error('💡 Set VITE_API_URL in Vercel environment variables to your backend URL')
  } else {
    console.log('🔧 Production Base URL:', BASE_URL)
  }
} else {
  console.log('🔧 Development Mode: Using Vite proxy')
}

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: BASE_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token and ensure /api prefix
instance.interceptors.request.use(
  (config) => {
    // 1. Ensure the URL starts with /api if it's a relative path
    if (config.url && !config.url.startsWith('http') && !config.url.startsWith('//')) {
      // Normalize URL - remove leading slash if any
      const urlPath = config.url.startsWith('/') ? config.url.slice(1) : config.url
      
      // Prepend /api if not already present
      if (!urlPath.startsWith('api/')) {
        config.url = `/api/${urlPath}`
      } else if (!config.url.startsWith('/')) {
        // Ensure it starts with /api/ even if it was api/
        config.url = `/${urlPath}`
      }
    }

    // 2. Check accessToken validity before making request
    const tokenValidation = checkAccessTokenValidity()
    
    if (!tokenValidation.success) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('accessToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
    }
    
    // 3. Get token from localStorage (prioritize accessToken)
    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // 4. Don't set Content-Type for FormData - let browser set it with boundary
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type']
    }
    
    return config
  },
  (error) => {
    return Promise.reject(error)
  }
)

// Response interceptor - Handle common errors and show messages
instance.interceptors.response.use(
  (response) => {
    return response
  },
  async (error) => {
    const originalRequest = error.config
    if (!originalRequest) return Promise.reject(error)

    // Check if this is a login request to avoid redirect loops
    const isLoginRequest = originalRequest.url?.includes('/accounts/login')
    
    // Check if this is truly a public endpoint (no auth required)
    // We only suppress errors for routes that are explicitly public and don't need a token
    const isPublicEndpoint = 
      // Sermon, Live, Child Dedication & other listing endpoints (read-only public data)
      originalRequest.url?.includes('/getSermonEvents') ||
      originalRequest.url?.includes('/getCompletedSermonEvents') ||
      originalRequest.url?.includes('/getMinistrySermonEvents') ||
      originalRequest.url?.includes('/getAvailableSundayDates') ||
      originalRequest.url?.includes('/church-records/') ||
      originalRequest.url?.includes('/cms/') ||
      originalRequest.url?.includes('/public/')
    
    // Check if current page is public
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isPublicPath = !currentPath.startsWith('/admin') && !currentPath.startsWith('/dashboard')
    
    // Don't show error messages for public endpoints when on public pages
    // This prevents "Authentication required" messages for casual browsers
    if (isPublicEndpoint && isPublicPath) {
      console.log('Public endpoint error on public path (ignored):', error.message)
      return Promise.reject(error)
    }

    // Handle 401 Unauthorized - token expired or invalid (only for non-public endpoints)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true
      
      // Only redirect if it's NOT a login request
      if (!isLoginRequest && typeof window !== 'undefined') {
        // Clear invalid tokens
        localStorage.removeItem('accessToken')
        localStorage.removeItem('auth_token')
        // Only redirect if not already on landing page AND NOT on a public page
        // We only want to force redirect if the user was on a protected admin/dashboard page
        if (window.location.pathname !== '/' && !isPublicPath) {
          window.location.href = '/'
        }
      }

      return Promise.reject(error)
    }
    
    // Handle other errors for non-public endpoints
    if (error.response) {
      // Server responded with error status
      console.error('API Error:', error.response.status, error.response.data)
      
      // Check for errors array first (preferred format with specific error messages)
      const errors = error.response.data?.errors
      if (errors && Array.isArray(errors) && errors.length > 0) {
        // Display all error messages from the errors array
        errors.forEach((errMsg) => {
          if (errMsg) {
            ElMessage.error(errMsg)
          }
        })
      } else {
        // Fallback to message or error field
        const errorMessage = error.response.data?.message || error.response.data?.error
        if (errorMessage) {
          ElMessage.error(errorMessage)
        } else {
          // Fallback to generic error messages based on status code
          const statusMessages = {
            400: 'Bad Request. Please check your input.',
            403: 'Access Forbidden. You do not have permission.',
            404: 'Resource not found.',
            500: 'Internal server error. Please try again later.',
            502: 'Bad Gateway. Please try again later.',
            503: 'Service unavailable. Please try again later.'
          }
          const genericMessage = statusMessages[error.response.status] || 'An error occurred. Please try again.'
          ElMessage.error(genericMessage)
        }
      }
    } else if (error.request) {
      // Request made but no response received
      console.error('Network Error:', error.request)
      
      // Check for connection refused errors
      const errorMessage = error.message || ''
      if (errorMessage.includes('ECONNREFUSED') || errorMessage.includes('Network Error') || error.code === 'ECONNREFUSED') {
        ElMessage.error('Cannot connect to backend server. Please ensure the backend is running on port 5000.')
        console.error('💡 Backend connection refused. Make sure to start the backend:')
        console.error('   cd church-be && npm run dev')
      } else {
        ElMessage.error('Network error. Please check your connection and try again.')
      }
    } else {
      // Something else happened
      console.error('Error:', error.message)
      ElMessage.error(error.message || 'An unexpected error occurred. Please try again.')
    }

    return Promise.reject(error)
  }
)

export default instance