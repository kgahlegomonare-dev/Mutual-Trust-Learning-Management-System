using System;
using System.Collections.Generic;
using System.Text;

namespace TYP.Domain.Entities
{
    public class AnnouncementAttachment
    {
        public int id { get; set; }
        public int announcement_id { get; set; }
        public string file_name { get; set; } =string.Empty;
        public string file_path { get; set; } = string.Empty;
        public string file_type {  get; set; }  = string.Empty;
        public long file_size { get; set; }
        public DateTime uploaded_at { get; set; }=DateTime.UtcNow;

        public Announcement announcement { get; set; } = null!;

    }
}
