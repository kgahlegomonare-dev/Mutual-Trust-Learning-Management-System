import api from '../api/axiosInstance';

/**
 * Bind a teacher to a subject inside a specific classroom venue
 * @param {Object} assignmentData - { teacher_id, subject_id, class_id }
 * @returns {Promise<Object>} Assignment validation payload
 */
export const createAssignment = async (assignmentData) => {
  try {
    const response = await api.post('/manager/assignments', assignmentData);
    return response.data;
  } catch (error) {
    console.error('Error committing teacher class assignment:', error);
    throw error;
  }
};

/**
 * Fetch all allocation structures tied to a specific class id location
 * @param {number|string} classId 
 * @returns {Promise<Array>} List of assignments with joined user profiles
 */
export const fetchAssignmentsByClass = async (classId) => {
  try {
    const response = await api.get(`/manager/classes/${classId}/assignments`);
    return response.data;
  } catch (error) {
    console.error(`Error querying assignments for class block ${classId}:`, error);
    throw error;
  }
};

/**
 * Unbind a teacher allocation mapping cell (wipes tied timetables automatically via database cascade)
 * @param {number|string} assignmentId 
 * @returns {Promise<Object>} Success receipt status payload
 */
export const deleteAssignment = async (assignmentId) => {
  try {
    const response = await api.delete(`/manager/assignments/${assignmentId}`);
    return response.data;
  } catch (error) {
    console.error(`Error breaking assignment connection ${assignmentId}:`, error);
    throw error;
  }
};