using System.Data;
using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface IAnnouncementRepository
    {
        Task<int> CreateAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            Announcement announcement);

        Task<int> UpdateAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            Announcement announcement);

        Task<int> DeleteAnnouncementAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId);

        Task<int> AddTargetsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            ICollection<AnnouncementTarget> targets);

        Task<int> DeleteTargetsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId);

        Task<int> AddRecipientsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            ICollection<AnnouncementRecipient> recipients);

        Task<int> DeleteRecipientsAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId);

        Task<ICollection<int>> GetRecipientsByTargetAsync(AnnouncementTarget target,int senderId);

        Task<bool> IsAnnouncementOwnerAsync(int announcementId, int userId);

        Task<ICollection<Announcement>> GetAnnouncementsForUserAsync(int userId);

        Task<AnnouncementAttachment?> GetAttachmentByAnnouncementIdAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int announcementId);

        Task<int> AddAttachmentAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            AnnouncementAttachment attachment);

        Task<int> DeleteAttachmentAsync(
            IDbConnection connection,
            IDbTransaction transaction,
            int attachmentId);
    }
}