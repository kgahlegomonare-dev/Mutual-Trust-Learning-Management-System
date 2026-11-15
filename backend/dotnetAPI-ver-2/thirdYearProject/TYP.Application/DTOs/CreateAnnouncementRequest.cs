using Microsoft.AspNetCore.Http;

namespace TYP.Application.DTOs
{
    public class CreateAnnouncementRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Message { get; set; } = string.Empty;
        public DateTime? ExpiresAt { get; set; }

        public string TargetsJson { get; set; } = string.Empty;

        public IFormFile? Attachment { get; set; }
    }
}