import { defineStore } from 'pinia'
import axios from '@/api/axios'

// Helper function to convert base64 to Blob
function base64ToBlob(base64String, contentType = 'image/jpeg') {
  // Remove data URL prefix if present
  let base64 = base64String
  if (base64String.includes(',')) {
    const parts = base64String.split(',')
    base64 = parts[1]
    // Try to extract content type from data URL
    const mimeMatch = parts[0].match(/data:([^;]+)/)
    if (mimeMatch) {
      contentType = mimeMatch[1]
    }
  }
  
  // Convert base64 to binary
  const byteCharacters = atob(base64)
  const byteNumbers = new Array(byteCharacters.length)
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i)
  }
  const byteArray = new Uint8Array(byteNumbers)
  
  return new Blob([byteArray], { type: contentType })
}

export const useEventsRecordsStore = defineStore('eventsRecords', {
  state: () => ({
    events: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      status: 'All Statuses',
      type: 'All Types'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    memberOptions: []
  }),

  getters: {},

  actions: {
    async fetchEvents(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const status = options.status !== undefined ? options.status : this.filters.status
        const type = options.type !== undefined ? options.type : this.filters.type
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRangeStart = (options.dateRangeStart !== undefined && options.dateRangeStart !== null) ? options.dateRangeStart : this.filters.dateRangeStart
        const dateRangeEnd = (options.dateRangeEnd !== undefined && options.dateRangeEnd !== null) ? options.dateRangeEnd : this.filters.dateRangeEnd

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (page) params.append('page', page)
        if (pageSize) params.append('pageSize', pageSize)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRangeStart) {
          params.append('dateRangeStart', dateRangeStart)
        }
        if (dateRangeEnd) {
          params.append('dateRangeEnd', dateRangeEnd)
        }

        const response = await axios.get(`/church-records/events/getAllEvents?${params}`)
        if (response.data.success) {
          this.events = response.data.data || []
          this.totalCount = response.data.totalCount || 0
          this.totalPages = response.data.pagination?.totalPages || 1
          this.currentPage = response.data.pagination?.page || 1
        } else {
          this.error = response.data.message || 'Failed to fetch events'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch events'
        console.error('Error fetching events:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchEventById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/events/getEventById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch event'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch event'
        console.error('Error fetching event:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createEvent(eventData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Create FormData for file upload
        const formData = new FormData()
        
        // Add all fields to FormData
        formData.append('title', eventData.title || '')
        formData.append('description', eventData.description || '')
        formData.append('start_date', eventData.start_date || '')
        formData.append('end_date', eventData.end_date || '')
        formData.append('location', eventData.location || '')
        if (eventData.link) {
          formData.append('link', eventData.link)
        }
        formData.append('type', eventData.type || '')
        formData.append('status', eventData.status || 'pending')
        
        // Add image file if provided
        if (eventData.imageFile) {
          formData.append('image', eventData.imageFile)
        } else if (eventData.image) {
          // If image is base64, convert to blob and add as file
          const blob = base64ToBlob(eventData.image)
          const file = new File([blob], 'event-image.jpg', { type: blob.type })
          formData.append('image', file)
        }
        
        // Add joined_members if provided (array of member IDs)
        if (eventData.joined_members !== undefined) {
          if (Array.isArray(eventData.joined_members)) {
            formData.append('joined_members', JSON.stringify(eventData.joined_members))
          } else if (eventData.joined_members) {
            formData.append('joined_members', eventData.joined_members)
          }
        }
        
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        const response = await axios.post('/church-records/events/createEvent', formData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          await this.fetchEvents({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to create event'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to create event'
        console.error('Error creating event:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateEvent(id, eventData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Create FormData for file upload
        const formData = new FormData()
        
        // Add all fields to FormData (only include defined fields)
        if (eventData.title !== undefined) formData.append('title', eventData.title)
        if (eventData.description !== undefined) formData.append('description', eventData.description)
        if (eventData.start_date !== undefined) formData.append('start_date', eventData.start_date)
        if (eventData.end_date !== undefined) formData.append('end_date', eventData.end_date)
        if (eventData.location !== undefined) formData.append('location', eventData.location)
        if (eventData.link !== undefined) {
          formData.append('link', eventData.link || '')
        }
        if (eventData.type !== undefined) formData.append('type', eventData.type)
        if (eventData.status !== undefined) formData.append('status', eventData.status)
        
        // Add image file if provided (new file or base64)
        if (eventData.imageFile) {
          // imageFile is already a File object
          formData.append('image', eventData.imageFile)
        } else if (eventData.image !== undefined) {
          if (eventData.image) {
            // If image is base64, convert to blob and add as file
            const blob = base64ToBlob(eventData.image)
            const file = new File([blob], 'event-image.jpg', { type: blob.type })
            formData.append('image', file)
          }
          // If image is null/empty, don't append (keeps existing image)
        }
        
        // Add joined_members if provided (array of member IDs)
        if (eventData.joined_members !== undefined) {
          if (Array.isArray(eventData.joined_members)) {
            formData.append('joined_members', JSON.stringify(eventData.joined_members))
          } else if (eventData.joined_members) {
            formData.append('joined_members', eventData.joined_members)
          }
        }
        
        // Don't set Content-Type header - axios will set it automatically with boundary for FormData
        const response = await axios.put(`/church-records/events/updateEvent/${id}`, formData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data.success) {
          await this.fetchEvents({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true, data: response.data.data }
        } else {
          this.error = response.data.message || 'Failed to update event'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update event'
        console.error('Error updating event:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async deleteEvent(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/events/deleteEvent/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          await this.fetchEvents({
            page: this.currentPage,
            pageSize: this.itemsPerPage,
            search: this.searchQuery
          })
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete event'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete event'
        console.error('Error deleting event:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async exportEventsToExcel(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const type = options.type !== undefined ? options.type : this.filters.type
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/events/exportExcel?${params}`, {
          responseType: 'blob',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'events_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?(.+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        console.error('Error exporting events to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export events to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      // Refetch with new search query
      this.fetchEvents({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchEvents({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchEvents({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchEvents({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async fetchMemberOptions() {
      try {
        const response = await axios.get('/church-records/members/getAllMembersForSelect')
        if (response.data.success && response.data.data) {
          this.memberOptions = response.data.data
        }
      } catch (error) {
        console.error('Error fetching member options:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member options'
      }
    },

    /**
     * Fetch events for a specific member (events they have joined)
     * @param {Number} memberId - Member ID
     * @param {Object} options - { page, pageSize, search, status, type, sortBy }
     * @returns {Promise<Object>} { success, data, totalPages, loading }
     */
    async fetchUserEvents(memberId, options = {}) {
      const { page = 1, pageSize = 10, search = '', status = '', type = '', sortBy = 'Date Created (Newest)' } = options
      
      this.loading = true
      this.error = null
      
      try {
        if (!memberId) {
          throw new Error('Member ID is required')
        }

        // Build query parameters
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        if (search && search.trim()) {
          params.append('search', search.trim())
        }
        
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        
        if (type && type !== 'All Types') {
          params.append('type', type)
        }
        
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        
        // Call backend API
        const response = await axios.get(`/church-records/events/getEventsByMemberId/${memberId}?${params.toString()}`)
        
        if (response.data.success) {
          // Map backend response to frontend format
          const events = response.data.data || []
          const formattedEvents = events.map(event => {
            // Use imageUrl from backend if available, otherwise convert base64 image to data URL
            let imageUrl = event.imageUrl || null
            if (!imageUrl && event.image) {
              // Fallback: If imageUrl not provided, convert base64 image to data URL
              imageUrl = event.image.startsWith('data:') 
                ? event.image 
                : `data:image/jpeg;base64,${event.image}`
            }
            
            return {
              event_id: event.event_id,
              eventName: event.title, // Map title to eventName for frontend compatibility
              title: event.title,
              description: event.description,
              start_date: event.start_date,
              end_date: event.end_date,
              location: event.location,
              link: event.link,
              type: event.type,
              status: event.status,
              imageUrl: imageUrl,
              ...event // Include all other fields
            }
          })
          
          const totalPages = response.data.pagination?.totalPages || 1
          
          return {
            success: true,
            data: formattedEvents,
            totalPages: totalPages,
            loading: false
          }
        } else {
          this.error = response.data.message || 'Failed to fetch user events'
          return {
            success: false,
            data: [],
            totalPages: 1,
            loading: false,
            error: this.error
          }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch user events'
        console.error('Error fetching user events:', error)
        return {
          success: false,
          data: [],
          totalPages: 1,
          loading: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    },

    /**
     * Fetch events for public landing page
     * @param {Object} options - { page, pageSize, search, selectedStatus }
     * @returns {Promise<Object>} { success, data, totalPages, loading }
     */
    async fetchPublicEvents(options = {}) {
      const { page = 1, pageSize = 3, search = '', selectedStatus = '' } = options
      
      this.loading = true
      this.error = null
      
      try {
        // Build query parameters
        const params = new URLSearchParams()
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        if (search && search.trim()) {
          params.append('search', search.trim())
        }

        // Add status filter if provided
        if (selectedStatus && selectedStatus !== '') {
          params.append('status', selectedStatus)
        }

        // Map frontend filter to backend type filter
        // You may need to adjust these mappings based on your backend type values
        if (selectedStatus === 'regular') {
          // Regular schedule events - map to a specific type if your backend has it
          // For now, we'll let backend handle all and filter client-side if needed
          params.append('sortBy', 'Start Date (Newest)')
        } else if (selectedStatus === 'yearly') {
          // Yearly events - you might have a type for yearly events
          params.append('sortBy', 'Start Date (Newest)')
        } else {
          // All upcoming events - show upcoming events only (future dates)
          params.append('sortBy', 'Start Date (Newest)')
        }
        
        // Call backend API
        const response = await axios.get(`/church-records/events/getAllEvents?${params.toString()}`)
        
        if (response.data.success) {
          // Map backend response to frontend format
          const events = response.data.data || []
          const formattedEvents = events.map(event => {
            // Use imageUrl from backend if available, otherwise convert base64 image to data URL
            let imageUrl = event.imageUrl || null
            if (!imageUrl && event.image) {
              // Fallback: If imageUrl not provided, convert base64 image to data URL
              imageUrl = event.image.startsWith('data:') 
                ? event.image 
                : `data:image/jpeg;base64,${event.image}`
            }
            
            return {
              event_id: event.event_id,
              eventName: event.title, // Map title to eventName for frontend compatibility
              title: event.title,
              description: event.description,
              start_date: event.start_date,
              end_date: event.end_date,
              location: event.location,
              link: event.link,
              type: event.type,
              status: event.status,
              imageUrl: imageUrl,
              ...event // Include all other fields
            }
          })
          
          const totalPages = response.data.pagination?.totalPages || 1
          
          return {
            success: true,
            data: formattedEvents,
            totalPages: totalPages,
            totalCount: response.data.totalCount || 0,
            loading: false
          }
        } else {
          this.error = response.data.message || 'Failed to fetch events'
          return {
            success: false,
            data: [],
            totalPages: 1,
            totalCount: 0,
            loading: false,
            error: this.error
          }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch events'
        console.error('Error fetching public events:', error)
        return {
          success: false,
          data: [],
          totalPages: 1,
          totalCount: 0,
          loading: false,
          error: this.error
        }
      } finally {
        this.loading = false
      }
    }
  }
})
