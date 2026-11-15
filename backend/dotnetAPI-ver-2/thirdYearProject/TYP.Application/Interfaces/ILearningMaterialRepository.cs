using System.Collections.Generic;
using System.Data;
using System.Threading.Tasks;
using TYP.Application.DTOs;
using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface ILearningMaterialRepository
    {
        // Create
        Task<int> UploadMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LearningMaterial material);

        // Read
        Task<LearningMaterial?> GetMaterialByIdAsync(int materialId);

        Task<ICollection<LearningMaterial>> GetMaterialsForClassAsync(int classId);

        Task<bool> IsMaterialOwnerAsync(int materialId, int teacherId);

        // Update
        Task<int> UpdateMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LearningMaterial material);

        // Delete
        Task<int> DeleteMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int materialId);

        //Getting the teaching assignment
        Task<ICollection<TeacherAssignmentResponse>>
          GetTeacherAssignmentsAsync(int teacherId);
        //Get the Learner enrollments
        Task<ICollection<LearnerEnrollmentDto>> GetLearnerEnrollmentsAsync(int learnerId);

  
        //Recording when the learning material was opened by the learner
        Task RecordMaterialOpenAsync(
            int learnerId,
            int materialId);
    }
       

    }