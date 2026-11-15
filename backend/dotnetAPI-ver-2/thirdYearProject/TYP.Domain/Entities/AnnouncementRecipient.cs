using System;
using System.Collections.Generic;
using System.Text;
using TYP.Domain.Enums;

namespace TYP.Domain.Entities
{
    public class AnnouncementRecipient
    {
       public int id { get; set; }
        public int announcement_id { get; set; }
        public int user_id { get; set; }
        public bool isRead { get; set; } = false;
        public DateTime? read_at { get; set; }
        public Announcement announcement { get; set; } = null!;

    }
}
