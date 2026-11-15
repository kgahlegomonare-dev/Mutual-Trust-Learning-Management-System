using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using TYP.Application.DTOs;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AnnouncementController : ControllerBase
    {
        private readonly IAnnouncementService _service;


        private int CurrentUserId
        {
            get
            {
                if (!Request.Headers.TryGetValue("X-User-Id", out var value))
                    throw new UnauthorizedAccessException("User ID header missing.");

                return int.Parse(value!);
            }
        }


        private int CurrentCenterId
        {
            get
            {
                if (!Request.Headers.TryGetValue("X-Center-Id", out var value))
                    return 0;

                return int.Parse(value!);
            }
        }


        private string CurrentRole
        {
            get
            {
                if (!Request.Headers.TryGetValue("X-User-Role", out var value))
                    return "";

                return value.ToString();
            }
        }


        public AnnouncementController(IAnnouncementService service)
        {
            _service = service;
        }


        [HttpPost]
        public async Task<IActionResult> Create([FromForm] CreateAnnouncementRequest request)
        {
            var targetRequests = ParseTargets(request.TargetsJson);


            List<AnnouncementTarget> targets = targetRequests.Select(t => new AnnouncementTarget
            {
                target_type = t.TargetType,
                target_value = t.TargetValue
            }).ToList();

            foreach (var target in targets)
            {
                Console.WriteLine($"TARGET TYPE: {target.target_type}");
                Console.WriteLine($"TARGET VALUE: {target.target_value}");
            }

            // Prevent Center Managers from sending announcements
            // to another centre
            if (CurrentRole == "Center Manager")
            {
                foreach (var target in targets)
                {
                    target.target_value = CurrentCenterId;
                }
            }


            Announcement announcement = new()
            {
                title = request.Title,
                message = request.Message,
                expires_at = request.ExpiresAt,
                sender_id = CurrentUserId
            };


            int id = await _service.SendAnnouncementAsync(
                announcement,
                targets,
                request.Attachment
            );


            return Ok(new { AnnouncementId = id });
        }



        [HttpPut("{id}")]
        public async Task<IActionResult> Update(
            int id,
            [FromForm] UpdateAnnouncementRequest request)
        {
            var targetRequests = ParseTargets(request.TargetsJson);


            List<AnnouncementTarget> targets = targetRequests.Select(t => new AnnouncementTarget
            {
                target_type = t.TargetType,
                target_value = t.TargetValue
            }).ToList();



            if (CurrentRole == "Center Manager")
            {
                foreach (var target in targets)
                {
                    target.target_value = CurrentCenterId;
                }
            }


            Announcement announcement = new()
            {
                id = id,
                title = request.Title,
                message = request.Message,
                expires_at = request.ExpiresAt,
                sender_id = CurrentUserId
            };


            bool success = await _service.UpdateAnnouncementAsync(
                announcement,
                targets,
                request.Attachment,
                CurrentUserId
            );


            if (!success)
                return Forbid();


            return NoContent();
        }



        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            bool success = await _service.DeleteAnnouncementAsync(
                id,
                CurrentUserId
            );


            if (!success)
                return Forbid();


            return NoContent();
        }



        [HttpGet]
        public async Task<IActionResult> GetAnnouncements()
        {
            Console.WriteLine($"User ID: {CurrentUserId}");
            Console.WriteLine($"Role: {CurrentRole}");
            Console.WriteLine($"Center ID: {CurrentCenterId}");

            var announcements =
                await _service.GetAllAnnouncementsForUserAsync(CurrentUserId);


            return Ok(announcements);
        }



        private static List<AnnouncementTargetRequest> ParseTargets(string? targetsJson)
        {
            Console.WriteLine("========== RAW TARGET JSON ==========");
            Console.WriteLine(targetsJson);

            var targets =
                JsonSerializer.Deserialize<List<AnnouncementTargetRequest>>(targetsJson)
                ?? new List<AnnouncementTargetRequest>();

            foreach (var target in targets)
            {
                Console.WriteLine(
                    $"DTO TargetType: {target.TargetType} ({(int)target.TargetType})"
                );

                Console.WriteLine(
                    $"DTO TargetValue: {target.TargetValue}"
                );
            }

            return targets;
        }
    }
}