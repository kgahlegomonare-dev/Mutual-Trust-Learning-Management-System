import axiosInstance from '../api/axiosInstance';

/**
 * Public Route: Login a user utilizing their custom identifier number and password string
 */
export const loginUser = async (login_number, password) => {
  const response = await axiosInstance.post('/auth/login', { login_number, password });
  return response.data; 
};

/**
 * Protected Route: Admin registers a Center Manager account
 * FIXED: Included manager_number in the payload object matrix
 */
export const registerCenterManager = async (email, center_id, manager_number) => {
  const response = await axiosInstance.post('/auth/register-manager', { email, center_id, manager_number });
  return response.data;
};

/**
 * Protected Route: Center Managers/Admin registers a Teacher account
 * FIXED: Included teacher_number in the dynamic generation payload
 */
export const registerTeacher = async (email, center_id = null, teacher_number, classIds = [], subjectIds = [], grades = []) => {
  const payload = {
    email,
    teacher_number,
    classIds,
    subjectIds,
    grades, 
    ...(center_id && { center_id })
  };
  
  const response = await axiosInstance.post('/auth/register-teacher', payload);
  return response.data;
};

/**
 * Protected Route: Center Managers register a Learner account
 * FIXED: Included learner_number inside data payload
 */
export const registerLearner = async (email, grade, highschool, learner_number, singleClassId, subjectIds = []) => {
  const payload = { 
    email, 
    grade, 
    highschool, 
    learner_number,
    classIds: singleClassId ? [singleClassId] : [], // Sends as classIds array to match controller structure safely
    subjectIds
  };

  const response = await axiosInstance.post('/auth/register-learner', payload);
  return response.data;
};

/**
 * Protected Route: Onboarding landing spot for any newly registered user to claim profile
 */
export const completeUserProfile = async (first_name, last_name, new_password) => {
  const response = await axiosInstance.put('/complete-profile', { first_name, last_name, new_password });
  return response.data;
};

/**
 * Protected Route: Fetch a list of active users filtered explicitly by their role query parameter
 */
export const getUsersByRole = async (role) => {
  const response = await axiosInstance.get(`/users?role=${role}`);
  return response.data;
};

/**
 * Protected Route: Search users across multi-tenant boundaries by text patterns and role scope strings
 */
export const searchUsers = async (query, role = '') => {
  const roleParam = role ? `&role=${role}` : '';
  const response = await axiosInstance.get(`/users/search?query=${encodeURIComponent(query)}${roleParam}`);
  return response.data;
};

/**
 * Protected Route: Modify core details of an existing user account profile
 */
export const updateUserDetails = async (id, updatedFields) => {
  const response = await axiosInstance.put(`/users/${id}`, updatedFields);
  return response.data;
};

/**
 * Protected Route: Soft-deactivate an account profile mapping target and log reason
 */
export const deactivateUser = async (id, reason) => {
  const response = await axiosInstance.patch(`/users/${id}/deactivate`, { reason });
  return response.data;
};