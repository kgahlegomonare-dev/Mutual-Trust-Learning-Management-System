using System;

namespace TYP.Domain.Entities
{
    public class LessonPlanner
    {
        public int planner_id { get; set; }

        public int teacher_id { get; set; }

        public int subject_id { get; set; }

        public int class_id { get; set; }

        public int week { get; set; }

        public DateOnly lesson_date { get; set; }

        public string planner_type { get; set; } = string.Empty;

        public string? topic { get; set; }

        public string? assessment_type { get; set; }

        public decimal? weighting { get; set; }

        public DateTime created_at { get; set; }
    }
}