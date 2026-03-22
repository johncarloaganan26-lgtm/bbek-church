import { defineStore } from 'pinia';
import { ref } from 'vue';
import axios from '@/api/axios';
import { ElMessage } from 'element-plus';

export const useDiscipleshipStore = defineStore('discipleship', () => {
    const loading = ref(false);

    const submitDiscipleshipRequest = async (data) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/discipleship-requests/submit', data);
            if (response.data.success) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Submission error:', error);
            const message = error.response?.data?.message || 'Failed to submit request. Please try again later.';
            ElMessage.error(message);
            return false;
        } finally {
            loading.value = false;
        }
    };

    const submitBibleStudyRequest = async (data) => {
        loading.value = true;
        try {
            const response = await axios.post('/services/biblestudy-requests/submit', data);
            if (response.data.success) {
                return true;
            }
            return false;
        } catch (error) {
            console.error('Bible Study submission error:', error);
            const message = error.response?.data?.message || 'Failed to submit Bible Study request. Please try again later.';
            ElMessage.error(message);
            return false;
        } finally {
            loading.value = false;
        }
    };

    const fetchAvailableSlots = async ({ date, service = 'salvation', days } = {}) => {
        try {
            const params = { service };
            if (date) params.date = date;
            if (days) params.days = days;

            const response = await axios.get('/services/discipleship-requests/available-slots', {
                params
            });
            return response.data;
        } catch (error) {
            console.error('Fetch available slots error:', error);
            return { success: false, data: [] };
        }
    };
    const fetchRegistrationData = async (id) => {
        try {
            const response = await axios.get(`/services/discipleship-requests/registration-data/${id}`);
            if (response.data.success) {
                return response.data.data;
            }
            return null;
        } catch (error) {
            console.error('Error fetching registration data:', error);
            return null;
        }
    };

    return {
        loading,
        submitDiscipleshipRequest,
        submitBibleStudyRequest,
        fetchAvailableSlots,
        fetchRegistrationData
    };
});
