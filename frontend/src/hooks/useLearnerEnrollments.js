import { useState, useEffect, useCallback } from "react";
import { getLearnerEnrollments } from "../../services/kgs-services/LearnerEnrollmentService";

export default function useLearnerEnrollments(learnerId) {
  const [enrollments, setEnrollments] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadEnrollments = useCallback(async () => {
    if (!learnerId) return;

    setLoading(true);
    setError("");

    try {
      const data = await getLearnerEnrollments(learnerId);

      setEnrollments(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);
      setError("Failed to load learner enrollments.");
      setEnrollments([]);
    } finally {
      setLoading(false);
    }
  }, [learnerId]);

  useEffect(() => {
    loadEnrollments();
  }, [loadEnrollments]);

  return {
    enrollments,
    loading,
    error,
    reload: loadEnrollments,
  };
}