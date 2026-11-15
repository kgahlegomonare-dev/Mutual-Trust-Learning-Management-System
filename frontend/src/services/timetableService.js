import api from '../api/axiosInstance';

/**
 * Create a brand new calendar schedule block
 * @param {Object} timetableData - { assignment_id, timetable_day, start_time, end_time }
 * @returns {Promise<Object>} Provisioned slot confirmation metadata
 */
export const createTimetableSlot = async (timetableData) => {
  try {
    const response = await api.post('/manager/timetables', timetableData);
    return response.data;
  } catch (error) {
    console.error('Error provisioning timetable calendar slot:', error);
    throw error;
  }
};

/**
 * Fetch the complete combined calendar matrix for a classroom venue frame
 * @param {number|string} classId 
 * @returns {Promise<Array>} List of combined slots with human readable names
 */
export const fetchClassTimetable = async (classId) => {
  try {
    const response = await api.get(`/manager/classes/${classId}/timetable`);
    return response.data;
  } catch (error) {
    console.error(`Error pulling composite calendar matrix for class ${classId}:`, error);
    throw error;
  }
};

/**
 * Hard remove an active timetable segment cell from the database layout
 * @param {number|string} timetableId 
 * @returns {Promise<Object>} Deletion clearance confirm response
 */
export const deleteTimetableSlot = async (timetableId) => {
  try {
    const response = await api.delete(`/manager/timetables/${timetableId}`);
    return response.data;
  } catch (error) {
    console.error(`Error dropping timetable block grid item ${timetableId}:`, error);
    throw error;
  }
};