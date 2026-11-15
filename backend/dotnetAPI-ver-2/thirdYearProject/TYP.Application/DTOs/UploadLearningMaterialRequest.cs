using Microsoft.AspNetCore.Http;

namespace TYP.Application.DTOs
{
    public class UploadLearningMaterialRequest
    {
        public string Title { get; set; } = string.Empty;

        public int SubjectId { get; set; }

        public int Grade { get; set; }

        public int ClassId { get; set; }

        public int TeacherId { get; set; }

        public IFormFile File { get; set; } = null!;
    }
}