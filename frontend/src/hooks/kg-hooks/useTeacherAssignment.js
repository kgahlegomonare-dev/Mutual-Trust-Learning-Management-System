import { useState, useEffect } from "react";
import { getTeacherAssignments } from "../../services/kgs-services/teacherAssignmentService";

export default function useTeacherAssignments(teacherId) {
  const [assignments, setAssignments] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!teacherId) return;

    loadAssignments();
  }, [teacherId]);

  const loadAssignments = async () => {
    try {
      setLoading(true);

      const data = await getTeacherAssignments(teacherId);

  
      setAssignments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setAssignments([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    assignments,
    loading,
    reload: loadAssignments,
  };
}