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

    return {
        loading,
        submitDiscipleshipRequest
    };
});
