import api from '../api/axiosInstance';

/**
 * Fetch all subjects, optionally filtered by a specific grade level query
 * @param {number|string} [grade] 
 * @returns {Promise<Array>} List of academic subjects
 */
export const fetchSubjects = async (grade = '') => {
  try {
    const url = grade ? `/manager/subjects?grade=${grade}` : '/manager/subjects';
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error fetching curriculum subjects:', error);
    throw error;
  }
};

/**
 * Provision a brand new academic subject catalog profile
 * @param {Object} subjectData - { subject_name, subject_code, grade }
 * @returns {Promise<Object>} Created subject row entry receipt
 */
export const createSubject = async (subjectData) => {
  try {
    const response = await api.post('/manager/subjects', subjectData);
    return response.data;
  } catch (error) {
    console.error('Error creating subject catalog entry:', error);
    throw error;
  }
};

/**
 * Modify parameters on an existing academic subject row template
 * @param {number|string} subjectId 
 * @param {Object} subjectData - { subject_name, subject_code, grade }
 * @returns {Promise<Object>} Updated row transaction payload
 */
export const updateSubject = async (subjectId, subjectData) => {
  try {
    const response = await api.put(`/manager/subjects/${subjectId}`, subjectData);
    return response.data;
  } catch (error) {
    console.error(`Error updating subject profile ${subjectId}:`, error);
    throw error;
  }
};

/**
 * Permanently purge a course subject out of the global curriculum
 * @param {number|string} subjectId 
 * @returns {Promise<Object>} Deletion success validation string
 */
export const deleteSubject = async (subjectId) => {
  try {
    const response = await api.delete(`/manager/subjects/${subjectId}`);
    return response.data;
  } catch (error) {
    console.error(`Error deleting subject tracking entry ${subjectId}:`, error);
    throw error;
  }
};