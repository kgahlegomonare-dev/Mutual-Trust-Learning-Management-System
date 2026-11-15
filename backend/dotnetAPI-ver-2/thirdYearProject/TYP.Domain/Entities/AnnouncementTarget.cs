using System;
using System.Collections.Generic;
using System.Text;
using TYP.Domain.Enums;

namespace TYP.Domain.Entities
{
    public class AnnouncementTarget
    {
        public int id {  get; set; }
        public int announcement_id { get; set; }
        public TargetType target_type { get; set; }
        public int? target_value { get; set; }
        public Announcement announcement { get; set; } = null!;
    }
}
