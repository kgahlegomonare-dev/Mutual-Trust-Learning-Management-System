import dotnetAxios from "../../api/dotnetAxios";

/*
    GET
    api/LearningMaterial/learner/{learnerId}

    Returns all class/subject enrollments for the learner.
*/

export const getLearnerEnrollments = async (learnerId) => {
  const response = await dotnetAxios.get(
    `/LearningMaterial/learner/${learnerId}`
  );

  return response.data;
};