using System.Data;
using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface ILessonPlannerRepository
    {
        Task<int> CreatePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LessonPlanner planner);

        Task<int> UpdatePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LessonPlanner planner);

        Task<int> DeletePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int plannerId);

        Task<LessonPlanner?> GetPlannerByIdAsync(
            int plannerId);

        Task<ICollection<LessonPlanner>> GetPlannerForClassAsync(
            int classId);

        Task<bool> PlannerExistsForDateAsync(
            int classId,
            DateOnly lessonDate);

        Task<bool> IsPlannerOwnerAsync(
            int plannerId,
            int teacherId);
    }
}