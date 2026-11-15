import { useState, useCallback } from 'react';
import { createTimetableSlot, fetchClassTimetable, deleteTimetableSlot } from '../services/timetableService';

export const useTimetables = (classId) => {
  const [timetableSlots, setTimetableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const loadTimetable = useCallback(async () => {
    if (!classId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchClassTimetable(classId);
      setTimetableSlots(data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to sync class timetable grid layout.');
    } finally {
      setLoading(false);
    }
  }, [classId]);

  const handleAddSlot = async (assignmentId, dayOfWeek, startTime, endTime) => {
    setLoading(true);
    setError(null);
    try {
      await createTimetableSlot({
        assignment_id: assignmentId,
        timetable_day: dayOfWeek,
        start_time: startTime,
        end_time: endTime
      });
      setSuccessMessage('Timetable session block committed.');
      setIsModalOpen(false);
      await loadTimetable();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to record timetable segment.');
    } finally {
      setLoading(false);
    }
  };

  const handleDropSlot = async (timetableId) => {
    setLoading(true);
    setError(null);
    try {
      await deleteTimetableSlot(timetableId);
      setSuccessMessage('Timetable session block dropped.');
      await loadTimetable();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete calendar session.');
    } finally {
      setLoading(false);
    }
  };

  return {
    timetableSlots,
    loading,
    error,
    successMessage,
    isModalOpen,
    setIsModalOpen,
    loadTimetable,
    handleAddSlot,
    handleDropSlot,
    setSuccessMessage,
    setError
  };
};