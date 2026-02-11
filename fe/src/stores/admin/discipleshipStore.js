import { defineStore } from 'pinia';
import { ref, computed } from 'vue';
import axios from '@/api/axios';
import { ElMessage } from 'element-plus';

export const useAdminDiscipleshipStore = defineStore('admin-discipleship', () => {
    const requests = ref([]);
    const loading = ref(false);
    const totalCount = ref(0);
    const currentPage = ref(1);
    const pageSize = ref(10);
    const filters = ref({
        status: 'All',
        search: ''
    });

    const pastors = ref([]);

    const fetchPastors = async () => {
        try {
            const response = await axios.get('/church-records/church-leaders/getAllChurchLeadersForSelect');
            if (response.data.success) {
                pastors.value = response.data.data;
            }
        } catch (error) {
            console.error('Error fetching pastors:', error);
        }
    };

    const fetchRequests = async () => {
        loading.value = true;
        try {
            const params = {
                page: currentPage.value,
                pageSize: pageSize.value,
                search: filters.value.search,
                status: filters.value.status === 'All' ? undefined : filters.value.status
            };

            const response = await axios.get('/services/discipleship-requests', { params });

            if (response.data.success) {
                requests.value = response.data.data;
                totalCount.value = response.data.pagination.totalCount;
            }
        } catch (error) {
            console.error('Error fetching discipleship requests:', error);
            ElMessage.error('Failed to fetch requests');
        } finally {
            loading.value = false;
        }
    };

    const updateRequest = async (id, data) => {
        loading.value = true;
        try {
            const response = await axios.put(`/services/discipleship-requests/${id}`, data);
            if (response.data.success) {
                ElMessage.success('Request updated successfully');
                await fetchRequests(); // Refresh list
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error updating request:', error);
            ElMessage.error('Failed to update request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const createRequest = async (data) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/discipleship-requests/submit', data);
            if (response.data.success) {
                ElMessage.success('New request created successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error creating request:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to create request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const promoteToBaptism = async (id) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/discipleship-requests/promote/${id}`);
            if (response.data.success) {
                ElMessage.success('Successfully promoted to Baptism candidates!');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error promoting request:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to promote request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const setPage = (page) => {
        currentPage.value = page;
        fetchRequests();
    };

    const setFilters = (newFilters) => {
        filters.value = { ...filters.value, ...newFilters };
        currentPage.value = 1; // Reset to first page on filter change
        fetchRequests();
    };

    const deleteRequest = async (id) => {
        loading.value = true;
        try {
            const response = await axios.delete(`/services/discipleship-requests/${id}`);
            if (response.data.success) {
                ElMessage.success('Request deleted successfully');
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error deleting request:', error);
            ElMessage.error('Failed to delete request');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const inviteToBaptism = async (id, isDecided = false) => {
        loading.value = true;
        try {
            const response = await axios.post(`/services/discipleship-requests/invite-baptism/${id}`, { isDecided });
            if (response.data.success) {
                if (isDecided) {
                    ElMessage.success('Candidate successfully promoted to Water Baptism module!');
                } else {
                    ElMessage.success('Baptism invitation email sent to the requester!');
                }
                await fetchRequests();
                return true;
            }
            return false;
        } catch (error) {
            console.error('Error sending invitation:', error);
            ElMessage.error(error.response?.data?.message || 'Failed to send invitation');
            return false;
        } finally {
            loading.value = false;
        }
    };

    const fetchRegistrationData = async (id) => {
        try {
            const response = await axios.get(`/services/discipleship-requests/registration-data/${id}`);
            return response.data.success ? response.data.data : null;
        } catch (error) {
            console.error('Error fetching registration data:', error);
            return null;
        }
    };

    return {
        requests,
        loading,
        totalCount,
        currentPage,
        pageSize,
        filters,
        pastors,
        fetchPastors,
        fetchRequests,
        updateRequest,
        promoteToBaptism,
        inviteToBaptism,
        fetchRegistrationData,
        deleteRequest,
        createRequest,
        setPage,
        setFilters
    };
});
