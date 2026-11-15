import { useState,useCallback } from "react";
import LearningMaterialService from "../../services/kgs-services/LearningMaterialService";

export default function useLearningMaterial() {
  const [materials, setMaterials] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  /*
  ============================================
  Load Materials
  ============================================
  */

  const loadMaterials = useCallback(async (classId) => {
    if (!classId) {
      setMaterials([]);
      return;
    }

    try {
      setLoading(true);
      setError("");

      const data = await LearningMaterialService.getClassMaterials(classId);

      setMaterials(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error(err);

      setError("Failed to load learning materials.");

      setMaterials([]);
    } finally {
      setLoading(false);
    }
  }, []);

  /*
  ============================================
  Upload
  ============================================
  */

  const uploadMaterial = async (formData) => {
    try {
      await LearningMaterialService.uploadMaterial(formData);
      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to upload learning material.");
      return false;
    }
  };

  /*
  ============================================
  Update
  ============================================
  */

  const updateMaterial = async (formData) => {
    try {
      await LearningMaterialService.updateMaterial(formData);
      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to update learning material.");
      return false;
    }
  };

  /*
  ============================================
  Delete
  ============================================
  */

  const deleteMaterial = async (materialId, teacherId) => {
    try {
      await LearningMaterialService.deleteMaterial(materialId, teacherId);

      return true;
    } catch (err) {
      console.error(err);
      setError("Failed to delete learning material.");
      return false;
    }
  };

  //TRACK WHEN A LEARNER OPENS THE LEARNING MATERIAL
  const recordMaterialOpen = async (materialId) => {
    try {
      await LearningMaterialService.recordMaterialOpen(materialId);
      return true;
    } catch (err) {
      console.error("Failed to record material open:", err);
      // Tracking failure should NOT prevent the learner from opening the learning material
      return false;
    }
  };

  return {
    materials,
    loading,
    error,

    loadMaterials,

    uploadMaterial,
    updateMaterial,
    deleteMaterial,
    recordMaterialOpen
  };
}