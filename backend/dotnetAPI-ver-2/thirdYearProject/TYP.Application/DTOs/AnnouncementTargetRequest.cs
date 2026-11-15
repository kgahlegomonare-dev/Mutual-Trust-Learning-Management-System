using System;
using System.Collections.Generic;
using System.Text;
using System.Text.Json.Serialization;
using TYP.Domain.Enums;

namespace TYP.Application.DTOs
{
    public class AnnouncementTargetRequest
    {
        [JsonPropertyName("targetType")]
        public TargetType TargetType { get; set; }

        [JsonPropertyName("targetValue")]
        public int? TargetValue { get; set; }
    }
}
