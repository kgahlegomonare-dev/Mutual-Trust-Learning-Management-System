import api from "../../api/axiosInstance";

export const getAllSubjects = async () => {
    const response = await api.get("/manager/subjects");
    return response.data;
};

export const getSubjectsByGrade = async (grade) => {
    const response = await api.get(`/manager/subjects?grade=${grade}`);
    return response.data;
};