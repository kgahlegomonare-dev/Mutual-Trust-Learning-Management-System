import axiosInstance from "../../api/dotnetAxios";

export const getTeacherAssignments = async (teacherId) => {
  const response = await axiosInstance.get(
    `/LearningMaterial/teacher/${teacherId}`
  );

  return response.data;
};