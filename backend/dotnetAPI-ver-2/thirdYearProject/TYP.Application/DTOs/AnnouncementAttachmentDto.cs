using System;
using System.Collections.Generic;
using System.Text;

namespace TYP.Application.DTOs
{
    public class AnnouncementAttachmentDto
    {
        public int Id { get; set; }

        public string FileName { get; set; }=string.Empty;

        public string FilePath { get; set; } = string.Empty;

        public string FileType { get; set; } = string.Empty;
    }
}
