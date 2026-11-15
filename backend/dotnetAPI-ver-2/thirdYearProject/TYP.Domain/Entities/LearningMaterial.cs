using System;

namespace TYP.Domain.Entities
{
    public class LearningMaterial
    {
        public int material_id { get; set; }

        public string title { get; set; } = string.Empty;

        public int subject_id { get; set; }

        public int grade { get; set; }

        public int class_id { get; set; }

        public int teacher_id { get; set; }

        public string file_name { get; set; } = string.Empty;

        public string file_path { get; set; } = string.Empty;

        public string file_type { get; set; } = string.Empty;

        public long file_size { get; set; }

        public DateTime uploaded_at { get; set; } = DateTime.UtcNow;
    }
}