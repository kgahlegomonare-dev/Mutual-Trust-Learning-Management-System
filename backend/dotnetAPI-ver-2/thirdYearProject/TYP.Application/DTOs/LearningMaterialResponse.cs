namespace TYP.Application.DTOs
{
    public class LearningMaterialResponse
    {
        public int MaterialId { get; set; }

        public string Title { get; set; } = string.Empty;

        public int SubjectId { get; set; }

        public int Grade { get; set; }

        public int ClassId { get; set; }

        public int TeacherId { get; set; }

        public string FileName { get; set; } = string.Empty;

        public string FileType { get; set; } = string.Empty;

        public long FileSize { get; set; }

        public DateTime UploadedAt { get; set; }
    }
}