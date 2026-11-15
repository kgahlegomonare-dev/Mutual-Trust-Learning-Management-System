import api from '../api/axiosInstance';

/**
 * Bind a learner to a subject inside a specific classroom venue
 * @param {Object} enrollmentData - { learner_id, subject_id, class_id }
 * @returns {Promise<Object>} Enrollment validation payload
 */
export const createLearnerEnrollment = async (enrollmentData) => {
  try {
    const response = await api.post('/manager/enrollments', enrollmentData);
    return response.data;
  } catch (error) {
    console.error('Error committing learner class enrollment:', error);
    throw error;
  }
};

/**
 * Fetch all active learner profiles enrolled in a specific class and subject combination
 * @param {number|string} classId 
 * @param {number|string} subjectId 
 * @returns {Promise<Array>} List of student enrollments with joined profiles
 */
export const fetchEnrollmentsByClassAndSubject = async (classId, subjectId) => {
  try {
    const response = await api.get(`/manager/classes/${classId}/subjects/${subjectId}/enrollments`);
    return response.data;
  } catch (error) {
    console.error(`Error querying enrollments for class block ${classId} and subject ${subjectId}:`, error);
    throw error;
  }
};

/**
 * Unbind a learner from a curriculum subject track completely
 * @param {number|string} enrollmentId 
 * @returns {Promise<Object>} Success receipt status payload
 */
export const deleteLearnerEnrollment = async (enrollmentId) => {
  try {
    const response = await api.delete(`/manager/enrollments/${enrollmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error breaking enrollment connection ${enrollmentId}:`, error);
    throw error;
  }
};