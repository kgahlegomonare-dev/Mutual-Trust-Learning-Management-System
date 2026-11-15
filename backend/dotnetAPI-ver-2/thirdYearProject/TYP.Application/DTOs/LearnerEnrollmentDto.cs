using System;
using System.Collections.Generic;
using System.Text;

namespace TYP.Application.DTOs
{
    public class LearnerEnrollmentDto
    {
        public int EnrollmentId { get; set; }

        public int LearnerId { get; set; }

        public int ClassId { get; set; }

        public int SubjectId { get; set; }

        public int Grade { get; set; }

        public string ClassName { get; set; } = string.Empty;

        public string SubjectName { get; set; } = string.Empty;
    }
}
