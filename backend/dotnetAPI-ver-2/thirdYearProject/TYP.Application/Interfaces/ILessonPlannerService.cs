using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface ILessonPlannerService
    {
        Task<int> CreatePlannerAsync(LessonPlanner planner);

        Task<bool> UpdatePlannerAsync(LessonPlanner planner);

        Task<bool> DeletePlannerAsync(int plannerId, int teacherId);

        Task<LessonPlanner?> GetPlannerByIdAsync(int plannerId);

        Task<ICollection<LessonPlanner>> GetPlannerForClassAsync(int classId);
    }
}