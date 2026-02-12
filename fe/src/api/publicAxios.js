import axios from 'axios'

// Vite environment configuration for API URL (same as main axios.js)
const API_URL = import.meta.env.PROD
  ? (import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '')
  : '/api'

// Create axios instance WITHOUT auth interceptor for public endpoints
const publicInstance = axios.create({
  baseURL: API_URL,
  timeout: 60000, // 60 seconds timeout
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add a simple response interceptor to handle errors gracefully
publicInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    // Log error but don't show user-facing error messages for public endpoints
    console.log('Public endpoint error:', error.message)
    return Promise.reject(error)
  }
)

export default publicInstance
