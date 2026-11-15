using System;
using System.Collections.Generic;

namespace TYP.Domain.Entities
{
    public class Announcement
    {
        public int id { get; set; }
        public string title { get; set; } = string.Empty;
        public string message { get; set; } = string.Empty;
        public int sender_id { get; set; }
        public DateTime created_at { get; set; } = DateTime.Now;
        public DateTime? expires_at { get; set; }

        public List<AnnouncementAttachment> attachments { get; set; } = new();
    }
}