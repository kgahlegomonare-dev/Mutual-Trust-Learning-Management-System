import api from "../../api/axiosInstance";

export const getClasses = async () => {
    const response = await api.get("/manager/classes");
    return response.data;
};