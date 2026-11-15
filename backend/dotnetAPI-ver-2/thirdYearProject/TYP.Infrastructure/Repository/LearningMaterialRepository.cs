using Dapper;
using System.Data;
using TYP.Application.DTOs;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;
using TYP.Infrastructure.Data;

namespace TYP.Infrastructure.Repository
{
    public class LearningMaterialRepository : ILearningMaterialRepository
    {
        private readonly IDbConnectionFactory _db;

        public LearningMaterialRepository(IDbConnectionFactory db)
        {
            _db = db;
        }

        //========================================================
        // CREATE
        //========================================================

        public async Task<int> UploadMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LearningMaterial material)
        {
            const string sql = @"
                INSERT INTO learningmaterial
                (
                    title,
                    subject_id,
                    grade,
                    class_id,
                    teacher_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size
                )
                VALUES
                (
                    @title,
                    @subject_id,
                    @grade,
                    @class_id,
                    @teacher_id,
                    @file_name,
                    @file_path,
                    @file_type,
                    @file_size
                )

                RETURNING material_id;
            ";

            return await connection.QuerySingleAsync<int>(
                sql,
                material,
                transaction);
        }

        //========================================================
        // READ
        //========================================================

        public async Task<LearningMaterial?> GetMaterialByIdAsync(int materialId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT *
                FROM learningmaterial
                WHERE material_id = @material_id;
            ";

            return await connection.QuerySingleOrDefaultAsync<LearningMaterial>(
                sql,
                new { material_id = materialId });
        }

        public async Task<ICollection<LearningMaterial>> GetMaterialsForClassAsync(int classId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT *
                FROM learningmaterial
                WHERE class_id = @class_id
                ORDER BY uploaded_at DESC;
            ";

            var materials = await connection.QueryAsync<LearningMaterial>(
                sql,
                new { class_id = classId });

            return materials.ToList();
        }

        public async Task<bool> IsMaterialOwnerAsync(int materialId, int teacherId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT COUNT(*)
                FROM learningmaterial
                WHERE material_id = @material_id
                AND teacher_id = @teacher_id;
            ";

            int count = await connection.QuerySingleAsync<int>(
                sql,
                new
                {
                    material_id = materialId,
                    teacher_id = teacherId
                });

            return count > 0;
        }

        //========================================================
        // UPDATE
        //========================================================

        public async Task<int> UpdateMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            LearningMaterial material)
        {
            const string sql = @"
                UPDATE learningmaterial
                SET
                    title = @title,
                    subject_id = @subject_id,
                    grade = @grade,
                    class_id = @class_id,
                    file_name = @file_name,
                    file_path = @file_path,
                    file_type = @file_type,
                    file_size = @file_size
                WHERE material_id = @material_id;
            ";

            return await connection.ExecuteAsync(
                sql,
                material,
                transaction);
        }

        //========================================================
        // DELETE
        //========================================================

        public async Task<int> DeleteMaterialAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int materialId)
        {
            const string sql = @"
                DELETE FROM learningmaterial
                WHERE material_id = @material_id;
            ";

            return await connection.ExecuteAsync(
                sql,
                new { material_id = materialId },
                transaction);
        }

        public async Task<ICollection<TeacherAssignmentResponse>> GetTeacherAssignmentsAsync(int teacherId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
SELECT
    ta.assignment_id AS AssignmentId,
    ta.subject_id AS SubjectId,
    s.subject_name AS SubjectName,
    ta.grade AS Grade,
    ta.class_id AS ClassId,
    c.class_name AS ClassName

FROM teacher_assignments ta

INNER JOIN subjects s
    ON ta.subject_id = s.subject_id

INNER JOIN classes c
    ON ta.class_id = c.class_id

WHERE ta.teacher_id = @teacherId

ORDER BY
    ta.grade,
    s.subject_name,
    c.class_name;
";
                var assignments =
                await connection.QueryAsync<TeacherAssignmentResponse>(
                    sql,
                    new
                    {
                        teacherId
                    });

            return assignments.ToList();
        }

        public async Task<ICollection<LearnerEnrollmentDto>>
    GetLearnerEnrollmentsAsync(int learnerId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
       SELECT
    le.enrollment_id AS EnrollmentId,
    le.learner_id    AS LearnerId,
    le.class_id      AS ClassId,
    le.subject_id    AS SubjectId,

    l.grade          AS Grade,

    c.class_name     AS ClassName,
    s.subject_name   AS SubjectName

FROM learner_enrollments le

INNER JOIN learners l
    ON l.user_id = le.learner_id

INNER JOIN classes c
    ON c.class_id = le.class_id

INNER JOIN subjects s
    ON s.subject_id = le.subject_id

WHERE le.learner_id = @learnerId

ORDER BY
    l.grade,
    s.subject_name,
    c.class_name;
    ";

            var result = await connection.QueryAsync<LearnerEnrollmentDto>(
                sql,
                new { learnerId });

            return result.ToList();
        }

        //========================================================
        // MATERIAL OPEN TRACKING
        //========================================================

        public async Task RecordMaterialOpenAsync(
            int learnerId,
            int materialId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
        INSERT INTO material_opens
        (
            learner_id,
            material_id
        )
        VALUES
        (
            @learnerId,
            @materialId
        )
        ON CONFLICT (learner_id, material_id)
        DO NOTHING;
    ";

            await connection.ExecuteAsync(
                sql,
                new
                {
                    learnerId,
                    materialId
                });
        }

    }
}