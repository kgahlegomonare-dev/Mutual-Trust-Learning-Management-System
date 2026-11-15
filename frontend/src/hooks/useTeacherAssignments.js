import { useState, useCallback } from 'react';
import { createAssignment, fetchAssignmentsByClass, deleteAssignment } from '../services/teacherAssignmentService';

export const useTeacherAssignments = (classId) => {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadAssignments = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchAssignmentsByClass(classId);
      setAssignments(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load classroom teacher mapping list.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleCreateAssignment = async (teacherId, subjectId) => {
    setLoading(true);
    setError(null);
    try {
      await createAssignment({ teacher_id: teacherId, subject_id: subjectId, class_id: classId });
      setSuccessMessage('Teacher assigned to subject context successfully.');
      setIsModalOpen(false);
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to tie teacher allocation row.');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveAssignment = async (assignmentId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteAssignment(assignmentId);
      setSuccessMessage('Assignment unlinked safely.');
      await loadAssignments();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop assignment link.');
    } finally {
      setLoading(false);
    }
  };

  return {
    assignments,
    loading,
    error,
    successMessage,
    isModalOpen,
    setIsModalOpen,
    loadAssignments,
    handleCreateAssignment,
    handleRemoveAssignment,
    setSuccessMessage,
    setError
  };
};