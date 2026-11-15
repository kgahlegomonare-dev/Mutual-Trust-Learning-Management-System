import axiosInstance from '../api/axiosInstance';

// Since axiosInstance handles your root '/api' pathing, we only append the resource scope
const BASE_URL = '/centers';

export const centerService = {
    /**
     * Fetches all centers from the backend
     * Maps to GET /api/admin/centers/all
     */
    async getAllCenters() {
        const response = await axiosInstance.get(`${BASE_URL}/all`);
        return response.data; // Axios automatically unwraps raw responses to JSON objects
    },

    /**
     * Fetches a single center's detailed profile by its ID
     * Maps to GET /api/admin/centers/:id
     */
    async getCenterById(id) {
        const response = await axiosInstance.get(`${BASE_URL}/${id}`);
        return response.data;
    },

    /**
     * Sends payload to create a brand new training center
     * Maps to POST /api/admin/centers
     */
    async createCenter(centerData) {
        const response = await axiosInstance.post(BASE_URL, centerData);
        return response.data;
    },

    /**
     * Updates an existing active center's information using its ID
     * Maps to PUT /api/admin/centers/:id
     */
    async updateCenter(id, centerData) {
        const response = await axiosInstance.put(`${BASE_URL}/${id}`, centerData);
        return response.data;
    },

    /**
     * Soft-deactivates a center by passing a mandatory justification reason
     * Maps to PATCH /api/admin/centers/deactivate/:id
     */
    async deactivateCenter(id, reason) {
        const response = await axiosInstance.patch(`${BASE_URL}/deactivate/${id}`, { reason });
        return response.data;
    }
};