using Microsoft.AspNetCore.Http;

namespace TYP.Application.DTOs
{
    public class UpdateAnnouncementRequest
    {
        public int Id { get; set; }

        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }

        public string TargetsJson { get; set; } = string.Empty;

        public IFormFile? Attachment { get; set; }
    }
}