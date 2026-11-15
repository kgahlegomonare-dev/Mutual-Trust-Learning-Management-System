using Microsoft.AspNetCore.Http;
using TYP.Application.DTOs;
using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface ILearningMaterialService
    {
        // Upload new learning material
        Task<int> UploadMaterialAsync(
            LearningMaterial material,
            IFormFile file);

        // Update metadata and optionally replace the file
        Task<bool> UpdateMaterialAsync(
            LearningMaterial material,
            IFormFile? newFile,
            int teacherId);

        // Delete a learning material
        Task<bool> DeleteMaterialAsync(
            int materialId,
            int teacherId);

        // View a single learning material
        Task<LearningMaterial?> GetMaterialByIdAsync(
            int materialId);

        // View all materials for a class
        Task<ICollection<LearningMaterial>> GetMaterialsForClassAsync(
            int classId);

        Task<ICollection<TeacherAssignmentResponse>>
           GetTeacherAssignmentsAsync(int teacherId);

        Task<ICollection<LearnerEnrollmentDto>>GetLearnerEnrollmentsAsync(int learnerId);

        //Record when learner opens learning material
        Task RecordMaterialOpenAsync( int learnerId,int materialId);
    }
}