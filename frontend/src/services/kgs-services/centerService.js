import api from "../../api/axiosInstance";

export const getCenters = async () => {
    const response = await api.get("/centers/all");
    return response.data;
};