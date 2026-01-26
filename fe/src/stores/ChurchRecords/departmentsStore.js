import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useDepartmentsStore = defineStore('departments', {
  state: () => ({
    departments: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      status: 'All Statuses',
      sortBy: 'Date Created (Newest)',
      dateRange: []
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 15],
    // Options for dropdowns
    memberOptions: [],
    searchTimeout: null,
    summaryStats: {
      totalJoinedMembers: 0
    }
  }),

  getters: {
    filteredDepartments: (state) => {
      // Backend handles filtering, so just return departments
      return state.departments
    },

    paginatedDepartments: (state) => {
      // Backend handles pagination, so just return departments
      return state.departments
    },

    totalDepartments: (state) => state.totalCount,

    activeDepartments: (state) => {
      // Calculate from current page data (approximate)
      // For accurate count, backend would need to return this
      return state.departments.filter(dept => dept.status === 'active').length
    },

    inactiveDepartments: (state) => {
      // Calculate from current page data (approximate)
      // For accurate count, backend would need to return this
      return state.departments.filter(dept => dept.status !== 'active').length
    },
    totalJoinedMembers: (state) => state.summaryStats.totalJoinedMembers || 0
  },

  actions: {
    async fetchDepartments(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        // Calculate offset from page and pageSize
        const offset = (page - 1) * pageSize

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('limit', pageSize.toString())
        params.append('offset', offset.toString())
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }
        if (dateRange && dateRange.length === 2) {
          params.append('dateRange', JSON.stringify(dateRange))
        }

        const response = await axios.get(`/church-records/departments/getAllDepartments?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.departments = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.departments.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update summary stats if available
          if (response.data.summaryStats) {
            this.summaryStats = {
              totalJoinedMembers: response.data.summaryStats.totalJoinedMembers || 0
            }
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.status !== undefined) {
            this.filters.status = status
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch departments'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch departments'
        console.error('Error fetching departments:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchDepartmentById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/departments/getDepartmentById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch department'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch department'
        console.error('Error fetching department:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createDepartment(departmentData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/departments/createDepartment', departmentData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Create department response:', response)
        
        if (response.data && response.status === 201) {
          await this.fetchDepartments()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create department'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating department:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create department'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateDepartment(id, departmentData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/departments/updateDepartment/${id}`, departmentData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Update department response:', response)
        
        if (response.data && response.status === 200) {
          await this.fetchDepartments()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to update department'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating department:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update department'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteDepartment(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/departments/deleteDepartment/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data && response.status === 200) {
          await this.fetchDepartments()
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete department'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete department'
        console.error('Error deleting department:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteDepartments(departmentIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')

      try {
        const response = await axios.delete('/church-records/departments/bulkDeleteDepartments', {
          data: {
            department_ids: departmentIds
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data && response.status === 200) {
          await this.fetchDepartments()
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete departments'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete departments'
        console.error('Error bulk deleting departments:', error)
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
          this.fetchDepartments({ search: query, page: 1, pageSize: this.itemsPerPage })
        }, 500) // 500ms debounce
      }
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchDepartments({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchDepartments({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchDepartments({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async exportDepartmentsToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        const search = options.search !== undefined ? options.search : this.searchQuery
        const status = options.status !== undefined ? options.status : this.filters.status
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy
        const dateRange = options.dateRange !== undefined ? options.dateRange : this.filters.dateRange

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (status && status !== 'All Statuses') {
          params.append('status', status)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/departments/exportExcel?${params}`, {
          responseType: 'blob'
        })

        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        const contentDisposition = response.headers['content-disposition']
        let filename = 'departments_export.xlsx'
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
        console.error('Error exporting departments to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export departments to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
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
    }
  }
})

