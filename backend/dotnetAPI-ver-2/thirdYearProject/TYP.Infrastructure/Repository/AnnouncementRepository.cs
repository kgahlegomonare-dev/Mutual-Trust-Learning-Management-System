using Dapper;
using System.Data;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;
using TYP.Domain.Enums;
using TYP.Infrastructure.Data;
using static System.Runtime.InteropServices.JavaScript.JSType;

namespace TYP.Infrastructure.Repository
{
    public partial class AnnouncementRepository : IAnnouncementRepository
    {
        private readonly IDbConnectionFactory _db;

        public AnnouncementRepository(IDbConnectionFactory connectionFactory)
        {
            _db = connectionFactory;
        }

        #region Create

        public async Task<int> CreateAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            Announcement announcement)
        {
            const string sql = @"
                INSERT INTO Announcement
                (
                    title,
                    announcement_message,
                    expires_at,
                    sender_id
                )
                VALUES
                (
                    @title,
                    @message,
                    @expires_at,
                    @sender_id
                )
                RETURNING announcement_id;";

            return await connection.QuerySingleAsync<int>(
                sql,
                announcement,
                transaction: transaction);
        }

        public async Task<int> AddTargetsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            ICollection<AnnouncementTarget> targets)
        {
            const string sql = @"
                INSERT INTO AnnouncementTarget
                (
                    announcement_id,
                    target_type,
                    target_value
                )
                VALUES
                (
                    @announcement_id,
                    CAST(@target_type AS target_type),
                    @target_value
                );";

            var parameters = targets.Select(t => new
            {
                t.announcement_id,
                target_type = t.target_type.ToString(),
                t.target_value
            });

            return await connection.ExecuteAsync(
                sql,
                parameters,
                transaction: transaction);
        }

        public async Task<int> AddRecipientsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            ICollection<AnnouncementRecipient> recipients)
        {
            const string sql = @"
                INSERT INTO AnnouncementRecipient
                (
                    announcement_id,
                    recipient_id
                )
                VALUES
                (
                    @announcement_id,
                    @user_id
                );";

            return await connection.ExecuteAsync(
                sql,
                recipients,
                transaction: transaction);
        }

        public async Task<int> AddAttachmentsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            ICollection<AnnouncementAttachment> attachments)
        {
            const string sql = @"
                INSERT INTO AnnouncementAttachment
                (
                    announcement_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size
                )
                VALUES
                (
                    @announcement_id,
                    @file_name,
                    @file_path,
                    @file_type,
                    @file_size
                );";

            return await connection.ExecuteAsync(
                sql,
                attachments,
                transaction: transaction);
        }

        #endregion

        #region Read

        public async Task<Announcement?> GetAnnouncementByIdAsync(int announcementId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT
                    announcement_id AS id,
                    title,
                    announcement_message AS message,
                    sender_id,
                    created_at,
                    expires_at
                FROM Announcement
                WHERE announcement_id = @announcementId;";

            return await connection.QuerySingleOrDefaultAsync<Announcement>(
                sql,
                new { announcementId });
        }

        public async Task<ICollection<Announcement>> GetAnnouncementsForUserAsync(int userId)
        {
            using var connection = _db.CreateConnection();

            const string announcementSql = @"
SELECT DISTINCT
    a.announcement_id AS id,
    a.title,
    a.announcement_message AS message,
    a.sender_id,
    a.created_at,
    a.expires_at
FROM Announcement a
LEFT JOIN AnnouncementRecipient ar
    ON a.announcement_id = ar.announcement_id
WHERE 
(
    ar.recipient_id = @userId
    OR a.sender_id = @userId
)
AND (a.expires_at IS NULL OR a.expires_at > NOW())
ORDER BY a.created_at DESC;";

            var announcements = (
                await connection.QueryAsync<Announcement>(
                    announcementSql,
                    new { userId })
            ).ToList();

            const string attachmentSql = @"
                SELECT
                    attachment_id AS id,
                    announcement_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size,
                    uploaded_at
                FROM AnnouncementAttachment
                WHERE announcement_id = @announcementId
                ORDER BY uploaded_at ASC;";

            foreach (var announcement in announcements)
            {
                announcement.attachments = (
                    await connection.QueryAsync<AnnouncementAttachment>(
                        attachmentSql,
                        new { announcementId = announcement.id })
                ).ToList();
            }

            return announcements;
        }

        public async Task<ICollection<int>> GetRecipientsByTargetAsync(
      AnnouncementTarget target,
      int senderId)
        {
            using var connection = _db.CreateConnection();

            string sql = target.target_type switch
            {
                //-------------------------------------------------
                // Entire System
                //-------------------------------------------------
                TargetType.System => @"
            SELECT user_id
            FROM users",

                //-------------------------------------------------
                // Entire Centre
                //-------------------------------------------------
                TargetType.Center => @"
            SELECT user_id
            FROM users
            WHERE center_id = @target_value
              AND user_role <> 'Admin'",

                //-------------------------------------------------
                // Centre Learners
                //-------------------------------------------------
                TargetType.CenterLearners => @"
            SELECT user_id
            FROM learners
            WHERE center_id = @target_value",

                //-------------------------------------------------
                // Centre Teachers
                //-------------------------------------------------
                TargetType.CenterTeachers => @"
            SELECT user_id
            FROM teachers
            WHERE center_id = @target_value",

                //-------------------------------------------------
                // Grade
                //-------------------------------------------------
                TargetType.Grade => @"
            SELECT user_id
            FROM learners
            WHERE grade = @target_value",

                //-------------------------------------------------
                // Class
                //-------------------------------------------------
                TargetType.Class => @"
            SELECT learner_id
            FROM learner_enrollments
            WHERE class_id = @target_value",

                //-------------------------------------------------
                // Teacher Assignment
                //-------------------------------------------------
                TargetType.TeacherAssignment => @"
SELECT DISTINCT le.learner_id
FROM learner_enrollments le

INNER JOIN teacher_assignments ta
    ON ta.class_id = le.class_id
   AND ta.subject_id = le.subject_id

WHERE ta.assignment_id = @target_value
AND ta.teacher_id = @senderId
",

                _ => throw new ArgumentOutOfRangeException(
                    nameof(target.target_type),
                    "Invalid target type.")
            };

            var recipients = await connection.QueryAsync<int>(
                sql,
                new
                {
                    target_value = target.target_value,
                    senderId
                });

            return recipients.ToList();
        }

        public async Task<bool> IsAnnouncementOwnerAsync(
            int announcementId,
            int userId)
        {
            using var connection = _db.CreateConnection();

            const string sql = @"
                SELECT EXISTS
                (
                    SELECT 1
                    FROM Announcement
                    WHERE announcement_id = @announcementId
                      AND sender_id = @userId
                );";

            return await connection.ExecuteScalarAsync<bool>(
                sql,
                new
                {
                    announcementId,
                    userId
                });
        }

        public async Task<AnnouncementAttachment?> GetAttachmentByAnnouncementIdAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId)
        {
            const string sql = @"
                SELECT
                    attachment_id AS id,
                    announcement_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size,
                    uploaded_at
                FROM AnnouncementAttachment
                WHERE announcement_id = @announcementId
                ORDER BY uploaded_at DESC
                LIMIT 1;";

            return await connection.QuerySingleOrDefaultAsync<AnnouncementAttachment>(
                sql,
                new { announcementId },
                transaction);
        }

        #endregion

        #region Update

        public async Task<int> UpdateAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            Announcement announcement)
        {
            const string sql = @"
                UPDATE Announcement
                SET
                    title = @title,
                    announcement_message = @message,
                    expires_at = @expires_at
                WHERE announcement_id = @id;";

            return await connection.ExecuteAsync(
                sql,
                announcement,
                transaction: transaction);
        }

        #endregion

        #region Delete Helpers

        public async Task<int> DeleteTargetsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId)
        {
            const string sql = @"
                DELETE FROM AnnouncementTarget
                WHERE announcement_id = @announcementId;";

            return await connection.ExecuteAsync(
                sql,
                new { announcementId },
                transaction: transaction);
        }

        public async Task<int> DeleteRecipientsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId)
        {
            const string sql = @"
                DELETE FROM AnnouncementRecipient
                WHERE announcement_id = @announcementId;";

            return await connection.ExecuteAsync(
                sql,
                new { announcementId },
                transaction: transaction);
        }

        public async Task<int> DeleteAttachmentsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            List<int> attachmentIds)
        {
            if (attachmentIds == null || attachmentIds.Count == 0)
                return 0;

            const string sql = @"
                DELETE FROM AnnouncementAttachment
                WHERE attachment_id = ANY(@Ids);";

            return await connection.ExecuteAsync(
                sql,
                new { Ids = attachmentIds },
                transaction);
        }

        public async Task<int> DeleteAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId)
        {
            const string sql = @"
                DELETE FROM Announcement
                WHERE announcement_id = @announcementId;";

            return await connection.ExecuteAsync(
                sql,
                new { announcementId },
                transaction: transaction);
        }

        #endregion

        #region Single Attachment Helpers

        public async Task<int> AddAttachmentAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            AnnouncementAttachment attachment)
        {
            const string sql = @"
                INSERT INTO AnnouncementAttachment
                (
                    announcement_id,
                    file_name,
                    file_path,
                    file_type,
                    file_size
                )
                VALUES
                (
                    @announcement_id,
                    @file_name,
                    @file_path,
                    @file_type,
                    @file_size
                )
                RETURNING attachment_id;";

            return await connection.QuerySingleAsync<int>(
                sql,
                attachment,
                transaction);
        }

        public async Task<int> DeleteAttachmentAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int attachmentId)
        {
            const string sql = @"
                DELETE FROM AnnouncementAttachment
                WHERE attachment_id = @attachmentId;";

            return await connection.ExecuteAsync(
                sql,
                new { attachmentId },
                transaction);
        }

        #endregion
    }
}