import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useEventsRecordsStore = defineStore('eventsRecords', {
  state: () => ({
    events: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      sortBy: 'Date Created (Newest)',
      status: 'All Statuses',
      type: 'All Types',
      dateRangeStart: null,
      dateRangeEnd: null
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [10, 20, 50, 100],
    memberOptions: [],
    searchTimeout: null
  }),

  getters: {
    paginatedEvents: (state) => {
      // Backend handles pagination, so just return events
      return state.events
    }
  },

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

          // Update filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
          if (options.dateRangeStart !== undefined) {
            this.filters.dateRangeStart = dateRangeStart
          }
          if (options.dateRangeEnd !== undefined) {
            this.filters.dateRangeEnd = dateRangeEnd
          }
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
        // Prepare event data as JSON (not FormData) - more reliable for Vercel
        const eventPayload = {
          title: eventData.title || '',
          description: eventData.description || '',
          start_date: eventData.start_date || '',
          end_date: eventData.end_date || '',
          location: eventData.location || '',
          link: eventData.link || '',
          type: eventData.type || '',
          status: eventData.status || 'pending'
        }

        // Add image as base64 if provided - ensure no data URL prefix
        if (eventData.imageFile) {
          // Convert File to base64 and strip data URL prefix if present
          const reader = new FileReader()
          const dataUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(eventData.imageFile)
          })
          // Always strip data URL prefix for backend compatibility
          eventPayload.image = (typeof dataUrl === 'string' && dataUrl.includes(',')) ? dataUrl.split(',')[1] : dataUrl
        } else if (eventData.image && typeof eventData.image === 'string' && eventData.image.startsWith('data:')) {
          // Strip data URL prefix from existing base64
          eventPayload.image = eventData.image.includes(',') ? eventData.image.split(',')[1] : eventData.image.replace('data:image/jpeg;base64,', '').replace('data:image/png;base64,', '').replace('data:image/gif;base64,', '').replace('data:image/webp;base64,', '')
        } else if (eventData.image) {
          // Raw base64 string
          eventPayload.image = eventData.image
        }

        // Add joined_members if provided
        if (eventData.joined_members !== undefined) {
          eventPayload.joined_members = JSON.stringify(eventData.joined_members)
        }

        const response = await axios.post('/church-records/events/createEvent', eventPayload, {
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
        // Prepare event data as JSON (not FormData) - more reliable for Vercel
        const eventPayload = {
          title: eventData.title || '',
          description: eventData.description || '',
          start_date: eventData.start_date || '',
          end_date: eventData.end_date || '',
          location: eventData.location || '',
          link: eventData.link || '',
          type: eventData.type || '',
          status: eventData.status || 'pending'
        }
        
        // Add image as base64 if provided (new file or existing base64)
        if (eventData.imageFile) {
          // Convert File to base64 and strip data URL prefix if present
          const reader = new FileReader()
          const dataUrl = await new Promise((resolve) => {
            reader.onload = () => resolve(reader.result)
            reader.readAsDataURL(eventData.imageFile)
          })
          eventPayload.image = (typeof dataUrl === 'string' && dataUrl.includes(',')) ? dataUrl.split(',')[1] : dataUrl
        } else if (eventData.image && typeof eventData.image === 'string' && eventData.image.startsWith('data:')) {
          // Already base64
          eventPayload.image = eventData.image
        } else if (eventData.image) {
          // Convert blob to base64
          eventPayload.image = eventData.image
        }
        
        // Add joined_members if provided
        if (eventData.joined_members !== undefined) {
          eventPayload.joined_members = JSON.stringify(eventData.joined_members)
        }
        
        const response = await axios.put(`/church-records/events/updateEvent/${id}`, eventPayload, {
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

      // Clear existing timeout
      if (this.searchTimeout) {
        clearTimeout(this.searchTimeout)
      }

      // Only search if query has at least 3 characters or is empty
      if (query.length >= 3 || query.length === 0) {
        // Debounce search to avoid too many API calls
        this.searchTimeout = setTimeout(() => {
          // Refetch with new search query
          this.fetchEvents({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
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
    },

    async bulkDeleteEvents(eventIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete('/church-records/events/bulkDeleteEvents', {
          data: { eventIds },
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
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete events'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete events'
        console.error('Error bulk deleting events:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Check if a member has joined an event
     * @param {number} eventId - Event ID
     * @param {number} memberId - Member ID
     * @returns {Promise<Object>} { success, hasJoined, event }
     */
    async checkMemberJoinedEvent(eventId, memberId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.get(`/church-records/events/checkJoined/${eventId}/${memberId}`)
        if (response.data.success) {
          return {
            success: true,
            hasJoined: response.data.hasJoined,
            event: response.data.event
          }
        } else {
          this.error = response.data.error || 'Failed to check event membership'
          return { success: false, hasJoined: false, error: this.error }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to check event membership'
        console.error('Error checking if member joined event:', error)
        return { success: false, hasJoined: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    /**
     * Join an event (add member to joined_members)
     * Prevents joining if event is completed or past
     * @param {number} eventId - Event ID
     * @param {number} memberId - Member ID
     * @returns {Promise<Object>} { success, message, error }
     */
    async joinEvent(eventId, memberId) {
      this.loading = true
      this.error = null
      try {
        const response = await axios.post('/church-records/events/joinEvent', {
          eventId,
          memberId
        })
        if (response.data.success) {
          return {
            success: true,
            message: response.data.message,
            data: response.data.data
          }
        } else {
          this.error = response.data.error || response.data.message || 'Failed to join event'
          return { success: false, message: response.data.message, error: this.error }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to join event'
        console.error('Error joining event:', error)
        return { success: false, message: error.response?.data?.message, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})
