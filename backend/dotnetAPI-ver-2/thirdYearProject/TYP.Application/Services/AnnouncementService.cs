using Microsoft.AspNetCore.Http;
using System.Data;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.Application.Services
{
    public class AnnouncementService : IAnnouncementService
    {
        private readonly IAnnouncementRepository _repo;
        private readonly IDbConnectionFactory _db;

        public AnnouncementService(
            IDbConnectionFactory db,
            IAnnouncementRepository repo)
        {
            _db = db;
            _repo = repo;
        }

        public async Task<int> SendAnnouncementAsync(
            Announcement announcement,
            ICollection<AnnouncementTarget> targets,
            IFormFile? attachment = null)
        {
            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                int announcementId = await _repo.CreateAnnouncementAsync(
                    connection,
                    transaction,
                    announcement);

                foreach (var target in targets)
                    target.announcement_id = announcementId;

                await _repo.AddTargetsAsync(connection, transaction, targets);

                HashSet<int> recipientIds = new();

                foreach (var target in targets)
                {
                    var ids = await _repo.GetRecipientsByTargetAsync(target,announcement.sender_id);
                    foreach (var id in ids)
                        recipientIds.Add(id);
                }

                List<AnnouncementRecipient> recipients = recipientIds
                    .Select(id => new AnnouncementRecipient
                    {
                        announcement_id = announcementId,
                        user_id = id
                    })
                    .ToList();

                Console.WriteLine($"SENDER ID: {announcement.sender_id}");

                foreach (var target in targets)
                {
                    Console.WriteLine(
                        $"TARGET TYPE: {target.target_type}, VALUE: {target.target_value}"
                    );

                    var ids = await _repo.GetRecipientsByTargetAsync(
                        target,
                        announcement.sender_id
                    );

                    Console.WriteLine($"FOUND RECIPIENTS: {ids.Count}");

                    foreach (var id in ids)
                    {
                        Console.WriteLine($"RECIPIENT: {id}");
                        recipientIds.Add(id);
                    }
                }

                Console.WriteLine("RECIPIENTS TO INSERT:");

                foreach (var r in recipients)
                {
                    Console.WriteLine(r.user_id);
                }

                await _repo.AddRecipientsAsync(
                    connection,
                    transaction,
                    recipients
                );

                if (attachment != null)
                {
                    var saved = await SaveAttachmentAsync(attachment);
                    saved.announcement_id = announcementId;

                    await _repo.AddAttachmentAsync(connection, transaction, saved);
                }

                transaction.Commit();
                
                return announcementId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> UpdateAnnouncementAsync(
            Announcement announcement,
            List<AnnouncementTarget> targets,
            IFormFile? attachment,
            int currentUserId)
        {
            bool owner = await _repo.IsAnnouncementOwnerAsync(
                announcement.id,
                currentUserId);

            if (!owner)
                return false;

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                await _repo.UpdateAnnouncementAsync(
                    connection,
                    transaction,
                    announcement);

                await _repo.DeleteTargetsAsync(
                    connection,
                    transaction,
                    announcement.id);

                await _repo.DeleteRecipientsAsync(
                    connection,
                    transaction,
                    announcement.id);

                foreach (var target in targets)
                    target.announcement_id = announcement.id;

                await _repo.AddTargetsAsync(connection, transaction, targets);

                HashSet<int> recipientIds = new();

                foreach (var target in targets)
                {
                    var ids = await _repo.GetRecipientsByTargetAsync(target,announcement.sender_id);
                    foreach (var id in ids)
                        recipientIds.Add(id);
                }

                List<AnnouncementRecipient> recipients = recipientIds
                    .Select(id => new AnnouncementRecipient
                    {
                        announcement_id = announcement.id,
                        user_id = id
                    })
                    .ToList();

                await _repo.AddRecipientsAsync(connection, transaction, recipients);

                if (attachment != null)
                {
                    var existing = await _repo.GetAttachmentByAnnouncementIdAsync(
                        connection,
                        transaction,
                        announcement.id);

                    if (existing != null)
                    {
                        await _repo.DeleteAttachmentAsync(
                            connection,
                            transaction,
                            existing.id);

                        DeletePhysicalFile(existing.file_path);
                    }

                    var saved = await SaveAttachmentAsync(attachment);
                    saved.announcement_id = announcement.id;

                    await _repo.AddAttachmentAsync(connection, transaction, saved);
                }

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> DeleteAnnouncementAsync(
            int announcementId,
            int currentUserId)
        {
            bool owner = await _repo.IsAnnouncementOwnerAsync(announcementId, currentUserId);

            if (!owner)
                return false;

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                var attachment = await _repo.GetAttachmentByAnnouncementIdAsync(
                    connection,
                    transaction,
                    announcementId);

                if (attachment != null)
                {
                    await _repo.DeleteAttachmentAsync(
                        connection,
                        transaction,
                        attachment.id);

                    DeletePhysicalFile(attachment.file_path);
                }

                await _repo.DeleteTargetsAsync(connection, transaction, announcementId);
                await _repo.DeleteRecipientsAsync(connection, transaction, announcementId);
                await _repo.DeleteAnnouncementAsync(connection, transaction, announcementId);

                transaction.Commit();
                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<ICollection<Announcement>> GetAllAnnouncementsForUserAsync(int userId)
        {
            return await _repo.GetAnnouncementsForUserAsync(userId);
        }

        private async Task<AnnouncementAttachment> SaveAttachmentAsync(IFormFile file)
        {
            string uploadsFolder = Path.Combine(
                Directory.GetCurrentDirectory(),
                "Uploads",
                "Announcements");

            if (!Directory.Exists(uploadsFolder))
                Directory.CreateDirectory(uploadsFolder);

            string uniqueFileName = $"{Guid.NewGuid()}{Path.GetExtension(file.FileName)}";
            string fullPath = Path.Combine(uploadsFolder, uniqueFileName);

            using var stream = new FileStream(fullPath, FileMode.Create);
            await file.CopyToAsync(stream);

            return new AnnouncementAttachment
            {
                file_name = file.FileName,
                file_path = Path.Combine("Uploads", "Announcements", uniqueFileName).Replace("\\", "/"),
                file_type = file.ContentType,
                file_size = file.Length
            };
        }

        private static void DeletePhysicalFile(string? relativePath)
        {
            if (string.IsNullOrWhiteSpace(relativePath))
                return;

            string fullPath = Path.Combine(Directory.GetCurrentDirectory(), relativePath);

            if (File.Exists(fullPath))
                File.Delete(fullPath);
        }
    }
}