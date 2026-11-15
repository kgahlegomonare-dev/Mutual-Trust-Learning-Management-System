import { useState, useCallback } from 'react';
import { fetchSubjects, createSubject, updateSubject, deleteSubject } from '../services/subjectService';

export const useSubjects = () => {
  const [subjects, setSubjects] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    selectedSubject: null,
  });

  const loadSubjects = useCallback(async (gradeFilter = '') => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchSubjects(gradeFilter);
      setSubjects(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch academic subjects.');
    } finally {
      setLoading(false);
    }
  }, []);

  const openCreateModal = () => setModalState({ isOpen: true, mode: 'create', selectedSubject: null });
  const openEditModal = (subj) => setModalState({ isOpen: true, mode: 'edit', selectedSubject: subj });
  const closeModal = () => setModalState(prev => ({ ...prev, isOpen: false }));

  const handleSaveSubject = async (subjectData) => {
    setLoading(true);
    setError(null);
    try {
      if (modalState.mode === 'create') {
        await createSubject(subjectData);
        setSuccessMessage(`Subject "${subjectData.subject_name}" added successfully.`);
      } else {
        await updateSubject(modalState.selectedSubject.subject_id, subjectData);
        setSuccessMessage(`Subject details updated successfully.`);
      }
      closeModal();
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save subject metadata.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteSubject = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await deleteSubject(id);
      setSuccessMessage('Subject removed successfully.');
      await loadSubjects();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to drop subject profile.');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubjects = subjects.filter(sub =>
    sub.subject_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    sub.subject_code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    subjects: filteredSubjects,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    successMessage,
    modalState,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSaveSubject,
    handleDeleteSubject,
    loadSubjects,
    setSuccessMessage,
    setError
  };
};