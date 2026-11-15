import { useState, useCallback } from 'react';
import { 
  fetchCenterClasses, 
  createClassroom, 
  updateClassroom, 
  archiveClassroom 
} from '../services/classService';

export const useClasses = () => {
  // Core Data Vectors
  const [classes, setClasses] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  
  // UI UX Feedback Flags
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Modal State Management Toggles
  const [modalState, setModalState] = useState({
    isOpen: false,
    mode: 'create', // 'create' or 'edit'
    selectedClass: null,
  });

  const [archiveTarget, setArchiveTarget] = useState(null);

  // 1. Fetch Loop Dispatcher
  const loadClasses = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await fetchCenterClasses();
      setClasses(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync classroom roster records.');
    } finally {
      setLoading(false);
    }
  }, []);

  // 2. Clear Feedback Banners Helper
  const clearFeedback = () => {
    setError(null);
    setSuccessMessage(null);
  };

  // 3. Open Modal for Adding a New Room
  const openCreateModal = () => {
    setModalState({ isOpen: true, mode: 'create', selectedClass: null });
    clearFeedback();
  };

  // 4. Open Modal for Updating an Existing Room
  const openEditModal = (targetClass) => {
    setModalState({ isOpen: true, mode: 'edit', selectedClass: targetClass });
    clearFeedback();
  };

  // 5. Close Form Modals cleanly
  const closeModal = () => {
    setModalState(prev => ({ ...prev, isOpen: false }));
    clearFeedback();
  };

  // 6. Execute Create or Update Form Dispatch
  const handleSaveClassroom = async (className, capacity) => {
    setLoading(true);
    setError(null);
    try {
      if (modalState.mode === 'create') {
        await createClassroom(className, parseInt(capacity));
        setSuccessMessage(`Classroom "${className}" provisioned successfully!`);
      } else {
        await updateClassroom(modalState.selectedClass.class_id, className, parseInt(capacity));
        setSuccessMessage(`Classroom configuration updated successfully!`);
      }
      closeModal();
      await loadClasses(); // Reload data matrix immediately
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to persist classroom adjustments.');
    } finally {
      setLoading(false);
    }
  };

  // 7. Execute Archive / Soft Deactivation Transaction
  const handleArchive = async (reason) => {
    if (!archiveTarget) return;
    setLoading(true);
    setError(null);
    try {
      await archiveClassroom(archiveTarget.class_id, reason);
      setSuccessMessage(`Classroom "${archiveTarget.class_name}" safely archived.`);
      setArchiveTarget(null);
      await loadClasses();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to archive classroom.');
    } finally {
      setLoading(false);
    }
  };

  // 8. Live Client-Side Roster Search Filtering Check
  const filteredClasses = classes.filter(cls => 
    cls.class_name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return {
    classes: filteredClasses,
    rawClassesCount: classes.length,
    searchTerm,
    setSearchTerm,
    loading,
    error,
    successMessage,
    modalState,
    archiveTarget,
    setArchiveTarget,
    openCreateModal,
    openEditModal,
    closeModal,
    handleSaveClassroom,
    handleArchive,
    loadClasses,
    clearFeedback
  };
};