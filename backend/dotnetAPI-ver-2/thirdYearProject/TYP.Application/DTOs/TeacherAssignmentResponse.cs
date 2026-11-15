using System;
using System.Collections.Generic;
using System.Text;

namespace TYP.Application.DTOs
{
    public class TeacherAssignmentResponse
    {
        public int AssignmentId { get; set; }

        public int SubjectId { get; set; }

        public string SubjectName { get; set; } = string.Empty;

        public int Grade { get; set; }

        public int ClassId { get; set; }

        public string ClassName { get; set; } = string.Empty;
    }
}
