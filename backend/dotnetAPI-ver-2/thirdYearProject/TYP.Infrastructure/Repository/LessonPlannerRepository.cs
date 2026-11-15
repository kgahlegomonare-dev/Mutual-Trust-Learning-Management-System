using Dapper;
using System.Data;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;
using TYP.Infrastructure.Data;

namespace TYP.Infrastructure.Repository
{
    public class LessonPlannerRepository : ILessonPlannerRepository
    {
        private readonly IDbConnectionFactory _db;

        public LessonPlannerRepository(IDbConnectionFactory db)
        {
            _db = db;
        }

        public async Task<int> CreatePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LessonPlanner planner)
        {
            const string sql = @"
                INSERT INTO LessonPlanner
                (
                    teacher_id,
                    subject_id,
                    class_id,
                    week,
                    lesson_date,
                    planner_type,
                    topic,
                    assessment_type,
                    weighting
                )
                VALUES
                (
                    @teacher_id,
                    @subject_id,
                    @class_id,
                    @week,
                    @lesson_date,
                    @planner_type,
                    @topic,
                    @assessment_type,
                    @weighting
                )
                RETURNING planner_id;";

            return await connection.QuerySingleAsync<int>(
                sql,
                planner,
                transaction);
        }

        public async Task<int> UpdatePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LessonPlanner planner)
        {
            const string sql = @"
                UPDATE LessonPlanner
                SET
                    subject_id=@subject_id,
                    class_id=@class_id,
                    week=@week,
                    lesson_date=@lesson_date,
                    planner_type=@planner_type,
                    topic=@topic,
                    assessment_type=@assessment_type,
                    weighting=@weighting
                WHERE planner_id=@planner_id;";

            return await connection.ExecuteAsync(
                sql,
                planner,
                transaction);
        }

        public async Task<int> DeletePlannerAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int plannerId)
        {
            const string sql = @"
                DELETE FROM LessonPlanner
                WHERE planner_id=@plannerId;";

            return await connection.ExecuteAsync(
                sql,
                new { plannerId },
                transaction);
        }

        public async Task<LessonPlanner?> GetPlannerByIdAsync(
            int plannerId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT *
                FROM LessonPlanner
                WHERE planner_id=@plannerId;";

            return await connection.QuerySingleOrDefaultAsync<LessonPlanner>(
                sql,
                new { plannerId });
        }

        public async Task<ICollection<LessonPlanner>> GetPlannerForClassAsync(
            int classId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT *
                FROM LessonPlanner
                WHERE class_id=@classId
                ORDER BY lesson_date;";

            var planners = await connection.QueryAsync<LessonPlanner>(
                sql,
                new { classId });

            return planners.ToList();
        }

        public async Task<bool> PlannerExistsForDateAsync(
            int classId,
            DateOnly lessonDate)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT COUNT(*)
                FROM LessonPlanner
                WHERE class_id=@classId
                AND lesson_date=@lessonDate;";

            int count = await connection.ExecuteScalarAsync<int>(
                sql,
                new
                {
                    classId,
                    lessonDate
                });

            return count > 0;
        }

        public async Task<bool> IsPlannerOwnerAsync(
            int plannerId,
            int teacherId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT COUNT(*)
                FROM LessonPlanner
                WHERE planner_id=@plannerId
                AND teacher_id=@teacherId;";

            int count = await connection.ExecuteScalarAsync<int>(
                sql,
                new
                {
                    plannerId,
                    teacherId
                });

            return count > 0;
        }
    }
}