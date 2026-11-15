using Microsoft.AspNetCore.Http;
using TYP.Domain.Entities;

namespace TYP.Application.Interfaces
{
    public interface IAnnouncementService
    {
        Task<int> SendAnnouncementAsync(
            Announcement announcement,
            ICollection<AnnouncementTarget> targets,
            IFormFile? attachment = null);

        Task<bool> UpdateAnnouncementAsync(
            Announcement announcement,
            List<AnnouncementTarget> targets,
            IFormFile? attachment,
            int currentUserId);

        Task<bool> DeleteAnnouncementAsync(
            int announcementId,
            int currentUserId);

        Task<ICollection<Announcement>> GetAllAnnouncementsForUserAsync(
            int userId);
    }
}