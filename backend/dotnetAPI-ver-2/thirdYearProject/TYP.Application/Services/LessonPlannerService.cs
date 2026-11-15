using System.Data;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.Application.Services
{
    public class LessonPlannerService : ILessonPlannerService
    {
        private readonly ILessonPlannerRepository _repo;
        private readonly IDbConnectionFactory _db;

        public LessonPlannerService(
            ILessonPlannerRepository repo,
            IDbConnectionFactory db)
        {
            _repo = repo;
            _db = db;
        }

        public async Task<int> CreatePlannerAsync(LessonPlanner planner)
        {
            ValidatePlanner(planner);

            bool exists = await _repo.PlannerExistsForDateAsync(
                planner.class_id,
                planner.lesson_date);

            if (exists)
                throw new Exception("A planner already exists for this class on the selected date.");

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                int plannerId = await _repo.CreatePlannerAsync(
                    connection,
                    transaction,
                    planner);

                transaction.Commit();

                return plannerId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdatePlannerAsync(LessonPlanner planner)
        {
            bool owner = await _repo.IsPlannerOwnerAsync(
                planner.planner_id,
                planner.teacher_id);

            if (!owner)
                return false;

            ValidatePlanner(planner);

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                await _repo.UpdatePlannerAsync(
                    connection,
                    transaction,
                    planner);

                transaction.Commit();

                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> DeletePlannerAsync(
            int plannerId,
            int teacherId)
        {
            bool owner = await _repo.IsPlannerOwnerAsync(
                plannerId,
                teacherId);

            if (!owner)
                return false;

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                await _repo.DeletePlannerAsync(
                    connection,
                    transaction,
                    plannerId);

                transaction.Commit();

                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<LessonPlanner?> GetPlannerByIdAsync(int plannerId)
        {
            return await _repo.GetPlannerByIdAsync(plannerId);
        }

        public async Task<ICollection<LessonPlanner>> GetPlannerForClassAsync(int classId)
        {
            return await _repo.GetPlannerForClassAsync(classId);
        }

        // ============================================================
        // PRIVATE VALIDATION
        // ============================================================

        private static void ValidatePlanner(LessonPlanner planner)
        {
            if (planner.planner_type.Equals("Lesson", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(planner.topic))
                    throw new Exception("Lesson topic is required.");

                planner.assessment_type = null;
                planner.weighting = null;
            }
            else if (planner.planner_type.Equals("Assessment", StringComparison.OrdinalIgnoreCase))
            {
                if (string.IsNullOrWhiteSpace(planner.assessment_type))
                    throw new Exception("Assessment type is required.");

                if (planner.weighting == null)
                    throw new Exception("Assessment weighting is required.");

                planner.topic = null;
            }
            else
            {
                throw new Exception("Planner type must be either 'Lesson' or 'Assessment'.");
            }
        }
    }
}