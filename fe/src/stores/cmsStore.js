import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useCmsStore = defineStore('cms', {
  state: () => ({
    // Cache for page data
    pageCache: {},
    // Promise cache for pending requests (prevents duplicate concurrent requests)
    pendingRequests: {},
    // Cache timestamps for potential TTL
    cacheTimestamps: {}
  }),

  getters: {
    /**
     * Get cached page data
     */
    getPageData: (state) => (pageName) => {
      return state.pageCache[pageName] || null
    },

    /**
     * Check if page is currently loading
     */
    isPageLoading: (state) => (pageName) => {
      return !!state.pendingRequests[pageName]
    }
  },

  actions: {
    /**
     * Fetch page data from CMS API
     * This method handles caching and prevents duplicate concurrent requests
     * @param {String} pageName - The page name (e.g., 'home', 'header')
     * @param {Boolean} forceRefresh - Force refresh even if cached
     * @returns {Promise<Object|null>} The page data with content and images
     */
    async fetchPageData(pageName, forceRefresh = false) {
      if (!pageName) {
        console.error('Page name is required')
        return null
      }

      // If cached and not forcing refresh, return cached data immediately
      if (this.pageCache[pageName] && !forceRefresh) {
        return this.pageCache[pageName]
      }

      // If there's already a pending request and we're not forcing refresh, wait for it
      if (this.pendingRequests[pageName] && !forceRefresh) {
        return this.pendingRequests[pageName]
      }

      // If forcing refresh, clear cache and any existing pending request to ensure we get fresh data
      if (forceRefresh) {
        console.log(`Force refresh requested for ${pageName}, clearing cache and pending requests`)
        delete this.pageCache[pageName]
        delete this.pendingRequests[pageName]
        delete this.cacheTimestamps[pageName]
      }

      // Create the request promise and store it
      const requestPromise = (async () => {
        try {
          // Add timestamp to bypass browser cache
          const timestamp = forceRefresh ? `?t=${Date.now()}` : ''
          const response = await axios.get(`/cms/${pageName}/full${timestamp}`)
          
          if (response.data.success && response.data.data) {
            const { page, images } = response.data.data
            
            // Cache the full response
            const cachedData = {
              page,
              images,
              content: page?.content || {}
            }
            
            this.pageCache[pageName] = cachedData
            this.cacheTimestamps[pageName] = Date.now()
            
            return cachedData
          } else {
            // Cache null result to prevent repeated failed requests
            this.pageCache[pageName] = null
            return null
          }
        } catch (error) {
          // Handle 404 gracefully (page doesn't exist yet)
          if (error.response?.status === 404) {
            this.pageCache[pageName] = null
            return null
          }
          
          console.error(`Error fetching CMS page ${pageName}:`, error)
          throw error
        } finally {
          // Remove from pending requests
          delete this.pendingRequests[pageName]
        }
      })()

      // Store the pending request promise
      this.pendingRequests[pageName] = requestPromise

      return requestPromise
    },

    /**
     * Clear cache for a specific page
     */
    clearCache(pageName) {
      if (pageName) {
        delete this.pageCache[pageName]
        delete this.cacheTimestamps[pageName]
        delete this.pendingRequests[pageName]
      } else {
        // Clear all cache
        this.pageCache = {}
        this.cacheTimestamps = {}
        this.pendingRequests = {}
      }
    }
  }
})

