namespace TYP.Application.DTOs
{
    public class CreateLessonPlannerRequest
    {
        public int TeacherId { get; set; }

        public int SubjectId { get; set; }

        public int ClassId { get; set; }

        public int Week { get; set; }

        public DateOnly LessonDate { get; set; }

        public string PlannerType { get; set; } = string.Empty;

        public string? Topic { get; set; }

        public string? AssessmentType { get; set; }

        public decimal? Weighting { get; set; }
    }
}