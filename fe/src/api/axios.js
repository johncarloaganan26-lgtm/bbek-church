import axios from 'axios'
import { ElMessage } from 'element-plus'
import { checkAccessTokenValidity } from '@/utils/tokenValidation'

// Vite environment configuration for API URL
// Development: '/api' is proxied by Vite dev server (configured in vite.config.js)
// Production: Must set VITE_API_URL environment variable (e.g., in Vercel settings)
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '')
  : '/api'

// Log configuration for debugging
if (import.meta.env.PROD) {
  if (!import.meta.env.VITE_API_URL) {
    console.error('❌ VITE_API_URL not set in production!')
    console.error('💡 Set VITE_API_URL in Vercel environment variables to your backend URL')
    console.error('💡 Example: https://your-backend-api.vercel.app')
  } else {
    console.log('🔧 Production API URL:', API_URL)
  }
} else {
  console.log('🔧 Development API URL:', API_URL, '(proxied by Vite)')
}

// Create axios instance with base configuration
const instance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Request interceptor - Add auth token if available and validate token
instance.interceptors.request.use(
  (config) => {
    // Check accessToken validity before making request
    const tokenValidation = checkAccessTokenValidity()
    
    if (!tokenValidation.success) {
      // Token is invalid or expired, clear it
      localStorage.removeItem('accessToken')
      localStorage.removeItem('auth_token')
      localStorage.removeItem('token')
    }
    
    // Get token from localStorage (prioritize accessToken)
    const token = localStorage.getItem('accessToken') || localStorage.getItem('auth_token') || localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    
    // Don't set Content-Type for FormData - let browser set it with boundary
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
    // Check if response has a success message field
    if (response.data?.message && response.status >= 200 && response.status < 300) {
      // Optionally show success messages (uncomment if needed)
      // ElMessage.success(response.data.message)
    }
    // Return response data directly for convenience
    return response
  },
  async (error) => {
    const originalRequest = error.config

    // Check if this is a public endpoint
    const isLoginRequest = originalRequest.url?.includes('/accounts/login')
    const isCmsEndpoint = originalRequest.url?.includes('/cms/')
    const isPublicEndpoint = originalRequest.url?.includes('/public/') ||
                             originalRequest.url?.includes('/church-records/') || 
                             originalRequest.url?.includes('/services/') ||
                             originalRequest.url?.includes('/events/') ||
                             originalRequest.url?.includes('/ministries/')
    
    // Check if current path is a public route (services pages, etc.)
    const currentPath = typeof window !== 'undefined' ? window.location.pathname : ''
    const isPublicPath = currentPath.startsWith('/services/') || 
                        currentPath.startsWith('/events/') ||
                        currentPath.startsWith('/ministries/') ||
                        currentPath.startsWith('/about/') ||
                        currentPath === '/' ||
                        currentPath === '/live' ||
                        currentPath === '/give' ||
                        currentPath === '/new' ||
                        currentPath === '/plan-your-visit' ||
                        currentPath === '/messages' ||
                        currentPath === '/schedule-change' ||
                        currentPath.startsWith('/beoneofus/')
    
    // Don't show error messages or redirect for public endpoints
    if (isPublicEndpoint || isCmsEndpoint || isPublicPath) {
      // For public endpoints, just log and return (no error message)
      console.log('Public endpoint error (ignored):', error.message)
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
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        
        // Show error message
        const errorMessage = error.response?.data?.message || error.response?.data?.error || 'Unauthorized. Please login again.'
        ElMessage.error(errorMessage)
        
        // Only redirect if not already on landing page
        if (window.location.pathname !== '/') {
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