import api from '../api/axiosInstance'; 

/**
 * Fetch all classes associated with the manager's center context
 * @returns {Promise<Array>} List of class objects
 */
export const fetchCenterClasses = async () => {
  try {
    const response = await api.get('/manager/classes');
    return response.data; // Returns array of class rows directly
  } catch (error) {
    console.error('Error in fetchCenterClasses service:', error);
    throw error;
  }
};

/**
 * Fetch details for a single specific class configuration
 * @param {number|string} classId 
 * @returns {Promise<Object>} The target classroom data object
 */
export const fetchClassById = async (classId) => {
  try {
    const response = await api.get(`/manager/classes/${classId}`);
    return response.data;
  } catch (error) {
    console.error(`Error fetching class ${classId}:`, error);
    throw error;
  }
};

/**
 * Provision a brand new classroom venue attached to the active center
 * @param {string} className 
 * @param {number} capacity 
 * @returns {Promise<Object>} Server verification payload
 */
export const createClassroom = async (className, capacity) => {
  try {
    const response = await api.post('/manager/classes', {
      class_name: className,
      class_capacity: capacity
    });
    return response.data;
  } catch (error) {
    console.error('Error creating classroom:', error);
    throw error;
  }
};

/**
 * Modify metadata settings for an existing classroom row
 * @param {number|string} classId 
 * @param {string} className 
 * @param {number} capacity 
 * @returns {Promise<Object>} Updated row entry
 */
export const updateClassroom = async (classId, className, capacity) => {
  try {
    const response = await api.put(`/manager/classes/${classId}`, {
      class_name: className,
      class_capacity: capacity
    });
    return response.data;
  } catch (error) {
    console.error(`Error updating classroom ${classId}:`, error);
    throw error;
  }
};

/**
 * Soft-deactivate an active classroom venue mapping
 * @param {number|string} classId 
 * @param {string} deactivationReason 
 * @returns {Promise<Object>} Deactivated status receipt
 */
export const archiveClassroom = async (classId, deactivationReason) => {
  try {
    const response = await api.patch(`/manager/classes/${classId}/deactivate`, {
      reason: deactivationReason
    });
    return response.data;
  } catch (error) {
    console.error(`Error deactivating classroom ${classId}:`, error);
    throw error;
  }
};