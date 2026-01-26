import { defineStore } from 'pinia'
import axios from '@/api/axios'

export const useMemberRecordStore = defineStore('memberRecord', {
  state: () => ({
    members: [],
    loading: false,
    error: null,
    searchQuery: '',
    filters: {
      ageRange: 'All Ages',
      gender: 'All Genders',
      joinMonth: 'All Months',
      sortBy: 'Name (A-Z)'
    },
    currentPage: 1,
    totalPages: 1,
    totalCount: 0,
    itemsPerPage: 10,
    pageSizeOptions: [5, 10, 15]
  }),

  getters: {
    filteredMembers: (state) => {
      let filtered = [...state.members]

      // Search filter
      if (state.searchQuery) {
        const query = state.searchQuery.toLowerCase()
        filtered = filtered.filter(member =>
          member.name?.toLowerCase().includes(query) ||
          member.address?.toLowerCase().includes(query) ||
          member.email?.toLowerCase().includes(query)
        )
      }

      // Age range filter
      if (state.filters.ageRange !== 'All Ages') {
        const [min, max] = state.filters.ageRange.split('-').map(Number)
        filtered = filtered.filter(member => {
          const age = member.age
          if (state.filters.ageRange === '51+') {
            return age >= 51
          }
          return age >= min && age <= max
        })
      }

      // Gender filter
      if (state.filters.gender !== 'All Genders') {
        filtered = filtered.filter(member => {
          return member.gender === state.filters.gender
        })
      }

      // Join month filter
      if (state.filters.joinMonth !== 'All Months') {
        filtered = filtered.filter(member => {
          if (!member.date_created) return false
          const memberDate = new Date(member.date_created)
          const memberMonth = memberDate.toLocaleString('en-US', { month: 'long' })
          return memberMonth === state.filters.joinMonth
        })
      }

      // Sort by join date (using date_created field)
      filtered.sort((a, b) => {
        switch (state.filters.sortBy) {
          case 'Name (A-Z)':
            return (a.name || '').localeCompare(b.name || '')
          case 'Name (Z-A)':
            return (b.name || '').localeCompare(a.name || '')
          case 'Join Date (Newest)':
            return new Date(b.date_created || 0) - new Date(a.date_created || 0)
          case 'Join Date (Oldest)':
            return new Date(a.date_created || 0) - new Date(b.date_created || 0)
          case 'Age (Low to High)':
            return (a.age || 0) - (b.age || 0)
          case 'Age (High to Low)':
            return (b.age || 0) - (a.age || 0)
          case 'Gender (Male First)':
            // Sort by gender: Male first
            const genderOrder = { 'Male': 1, 'Female': 2 }
            return (genderOrder[a.gender] || 3) - (genderOrder[b.gender] || 3)
          case 'Gender (Female First)':
            // Sort by gender: Female first
            const genderOrder2 = { 'Female': 1, 'Male': 2 }
            return (genderOrder2[a.gender] || 3) - (genderOrder2[b.gender] || 3)
          default:
            return 0
        }
      })

      return filtered
    },

    paginatedMembers: (state) => {
      const start = (state.currentPage - 1) * state.itemsPerPage
      const end = start + state.itemsPerPage
      return state.filteredMembers.slice(start, end)
    }
  },

  actions: {
    async fetchMembers(options = {}) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        // Use options or fallback to state values
        const page = options.page !== undefined ? options.page : this.currentPage
        const pageSize = options.pageSize !== undefined ? options.pageSize : this.itemsPerPage
        const search = options.search !== undefined ? options.search : this.searchQuery
        const ageRange = options.ageRange !== undefined ? options.ageRange : this.filters.ageRange
        const gender = options.gender !== undefined ? options.gender : this.filters.gender
        const joinMonth = options.joinMonth !== undefined ? options.joinMonth : this.filters.joinMonth
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        // Calculate offset from page and pageSize
        const offset = (page - 1) * pageSize

        const params = new URLSearchParams()
        if (search) params.append('search', search)
        params.append('limit', pageSize.toString())
        params.append('offset', offset.toString())
        params.append('page', page.toString())
        params.append('pageSize', pageSize.toString())
        
        // Add filter parameters (only if not default values)
        if (ageRange && ageRange !== 'All Ages') {
          params.append('ageRange', ageRange)
        }
        if (gender && gender !== 'All Genders') {
          params.append('gender', gender)
        }
        if (joinMonth && joinMonth !== 'All Months') {
          params.append('joinMonth', joinMonth)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        const response = await axios.get(`/church-records/members/getAllMembers?${params}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        
        if (response.data && response.data.success) {
          this.members = response.data.data || []
          
          // Update pagination state
          this.currentPage = page
          this.itemsPerPage = pageSize
          
          // Use backend pagination data if available
          if (response.data.pagination) {
            this.totalPages = response.data.pagination.totalPages || 1
            this.totalCount = response.data.pagination.totalCount || 0
          } else {
            // Fallback calculation
            const totalCount = response.data.totalCount || response.data.count || this.members.length
            this.totalCount = totalCount
            this.totalPages = Math.ceil(totalCount / pageSize) || 1
          }
          
          // Update search query and filters if provided
          if (options.search !== undefined) {
            this.searchQuery = search
          }
          if (options.ageRange !== undefined) {
            this.filters.ageRange = ageRange
          }
          if (options.gender !== undefined) {
            this.filters.gender = gender
          }
          if (options.joinMonth !== undefined) {
            this.filters.joinMonth = joinMonth
          }
          if (options.sortBy !== undefined) {
            this.filters.sortBy = sortBy
          }
        } else {
          this.error = response.data?.message || 'Failed to fetch members'
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch members'
        console.error('Error fetching members:', error)
      } finally {
        this.loading = false
      }
    },

    async fetchMemberById(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.get(`/church-records/members/getMemberById/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          return response.data.data
        } else {
          this.error = response.data.message || 'Failed to fetch member'
          return null
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to fetch member'
        console.error('Error fetching member:', error)
        return null
      } finally {
        this.loading = false
      }
    },

    async createMember(memberData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.post('/church-records/members/createMember', memberData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Create member response:', response)
        
        if (response.data && response.status===201) {
          await this.fetchMembers()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to create member'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error creating member:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to create member'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async updateMember(id, memberData) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/members/updateMember/${id}`, memberData, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        console.log('Update member response:', response)
        
        if (response.data && response.status===200) {
          await this.fetchMembers()
          return { success: true, data: response.data.data }
        } else {
          const errorMsg = response.data?.message || 'Failed to update member'
          this.error = errorMsg
          return { success: false, error: errorMsg }
        }
      } catch (error) {
        console.error('Error updating member:', error)
        const errorMsg = error.response?.data?.error || error.response?.data?.message || error.message || 'Failed to update member'
        this.error = errorMsg
        return { success: false, error: errorMsg }
      } finally {
        this.loading = false
      }
    },

    async deleteMember(id) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.delete(`/church-records/members/deleteMember/${id}`, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data && response.status===200) {
          await this.fetchMembers()
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to delete member'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to delete member'
        console.error('Error deleting member:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async bulkDeleteMembers(memberIds) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')

      try {
        const response = await axios.delete('/church-records/members/bulkDeleteMembers', {
          data: {
            member_ids: memberIds
          },
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })

        if (response.data && response.status === 200) {
          await this.fetchMembers()
          return {
            success: true,
            data: response.data.data,
            message: response.data.message
          }
        } else {
          this.error = response.data.message || 'Failed to bulk delete members'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to bulk delete members'
        console.error('Error bulk deleting members:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    async updateMemberActiveStatus(id, active) {
      this.loading = true
      this.error = null
      const accessToken = localStorage.getItem('accessToken')
      try {
        const response = await axios.put(`/church-records/members/updateMember/${id}`, { active }, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json'
          }
        })
        if (response.data.success) {
          const member = this.members.find(m => m.id === id)
          if (member) {
            member.active = active
          }
          return { success: true }
        } else {
          this.error = response.data.message || 'Failed to update member status'
          return { success: false, error: response.data.message }
        }
      } catch (error) {
        this.error = error.response?.data?.error || error.message || 'Failed to update member status'
        console.error('Error updating member status:', error)
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    },

    setSearchQuery(query) {
      this.searchQuery = query
      this.currentPage = 1
      // Refetch with new search query
      this.fetchMembers({ search: query, page: 1, pageSize: this.itemsPerPage })
    },

    setFilters(filters) {
      this.filters = { ...this.filters, ...filters }
      this.currentPage = 1
      // Refetch with new filters
      this.fetchMembers({ 
        ...filters, 
        page: 1, 
        pageSize: this.itemsPerPage, 
        search: this.searchQuery 
      })
    },

    setCurrentPage(page) {
      this.currentPage = page
      // Refetch with new page
      this.fetchMembers({ page, pageSize: this.itemsPerPage, search: this.searchQuery })
    },

    setPageSize(pageSize) {
      // Validate pageSize is in allowed options
      if (this.pageSizeOptions.includes(pageSize)) {
        this.itemsPerPage = pageSize
        this.currentPage = 1 // Reset to first page when changing page size
        // Refetch with new page size
        this.fetchMembers({ page: 1, pageSize, search: this.searchQuery })
      } else {
        console.warn(`Page size ${pageSize} is not in allowed options: ${this.pageSizeOptions.join(', ')}`)
      }
    },

    async exportMembersToExcel(options = {}) {
      this.loading = true
      this.error = null
      try {
        // Use current filters if not provided
        const search = options.search !== undefined ? options.search : this.searchQuery
        const ageRange = options.ageRange !== undefined ? options.ageRange : this.filters.ageRange
        const gender = options.gender !== undefined ? options.gender : this.filters.gender
        const joinMonth = options.joinMonth !== undefined ? options.joinMonth : this.filters.joinMonth
        const sortBy = options.sortBy !== undefined ? options.sortBy : this.filters.sortBy

        // Build query parameters
        const params = new URLSearchParams()
        if (search) params.append('search', search)
        if (ageRange && ageRange !== 'All Ages') {
          params.append('ageRange', ageRange)
        }
        if (gender && gender !== 'All Genders') {
          params.append('gender', gender)
        }
        if (joinMonth && joinMonth !== 'All Months') {
          params.append('joinMonth', joinMonth)
        }
        if (sortBy) {
          params.append('sortBy', sortBy)
        }

        // Make request with responseType: 'blob' to handle binary data
        // Note: axios baseURL is already '/api', so use relative path
        const response = await axios.get(`/church-records/members/exportExcel?${params}`, {
          responseType: 'blob',
          headers: {
            'Accept': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
          }
        })

        // Create blob from response
        const blob = new Blob([response.data], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        })

        // Create download link
        const url = window.URL.createObjectURL(blob)
        const link = document.createElement('a')
        link.href = url

        // Get filename from Content-Disposition header or use default
        const contentDisposition = response.headers['content-disposition']
        let filename = 'members_export.xlsx'
        if (contentDisposition) {
          const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/i)
          if (filenameMatch) {
            filename = filenameMatch[1]
          }
        }

        link.setAttribute('download', filename)
        document.body.appendChild(link)
        link.click()

        // Cleanup
        link.remove()
        window.URL.revokeObjectURL(url)

        return { success: true, message: 'Excel file downloaded successfully' }
      } catch (error) {
        console.error('Error exporting members to Excel:', error)
        this.error = error.response?.data?.error || error.message || 'Failed to export members to Excel'
        return { success: false, error: this.error }
      } finally {
        this.loading = false
      }
    }
  }
})

