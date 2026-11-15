import axiosInstance from "../../api/dotnetAxios";

/*
============================================
Teacher Assignments
============================================
*/

export const getTeacherAssignments = async (teacherId) => {
  const response = await axiosInstance.get(
    `/LearningMaterial/teacher/${teacherId}`,
  );

  return response.data;
};

/*
============================================
Learner Enrollments
============================================
*/

export const getLearnerEnrollments = async (learnerId) => {
  const response = await axiosInstance.get(
    `/LearningMaterial/learner/${learnerId}`,
  );

  return response.data;
};

/*
============================================
Learning Materials
============================================
*/

export const getClassMaterials = async (classId) => {
  const response = await axiosInstance.get(
    `/LearningMaterial/class/${classId}`,
  );

  return response.data;
};

/*
============================================
Upload
============================================
*/

export const uploadMaterial = async (formData) => {
  const response = await axiosInstance.post("/LearningMaterial", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/*
============================================
Update
============================================
*/

export const updateMaterial = async (formData) => {
  const response = await axiosInstance.put("/LearningMaterial", formData, {
    headers: {
      "Content-Type": "multipart/form-data",
    },
  });

  return response.data;
};

/*
============================================
Delete
============================================
*/

export const deleteMaterial = async (materialId, teacherId) => {
  const response = await axiosInstance.delete(
    `/LearningMaterial/${materialId}/${teacherId}`,
  );

  return response.data;
};

/* Record first material open */
export const recordMaterialOpen = async (materialId) => {
  console.log("SERVICE: POST", `/LearningMaterial/${materialId}/open`);

  try {
    const response = await axiosInstance.post(
      `/LearningMaterial/${materialId}/open`,
    );

    console.log("SERVICE: response:", response.status);
    console.log("SERVICE: data:", response.data);

    return response.data;
  } catch (err) {
    console.error("SERVICE ERROR:", err);

    if (err.response) {
      console.error("SERVICE STATUS:", err.response.status);
      console.error("SERVICE DATA:", err.response.data);
    }

    throw err;
  }
};

export default {
  getTeacherAssignments,
  getLearnerEnrollments,
  getClassMaterials,
  uploadMaterial,
  updateMaterial,
  deleteMaterial,
  recordMaterialOpen,
};
