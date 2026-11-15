using Microsoft.AspNetCore.Mvc;
using TYP.Application.DTOs;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LessonPlannerController : ControllerBase
    {
        private readonly ILessonPlannerService _service;

        public LessonPlannerController(ILessonPlannerService service)
        {
            _service = service;
        }

        //=========================================================
        // CREATE LESSON PLANNER
        //=========================================================

        [HttpPost]
        public async Task<IActionResult> CreatePlanner(
            [FromBody] CreateLessonPlannerRequest request)
        {
            var planner = new LessonPlanner
            {
                teacher_id = request.TeacherId,
                subject_id = request.SubjectId,
                class_id = request.ClassId,
                week = request.Week,
                lesson_date = request.LessonDate,
                planner_type = request.PlannerType,
                topic = request.Topic,
                assessment_type = request.AssessmentType,
                weighting = request.Weighting
            };

            int plannerId = await _service.CreatePlannerAsync(planner);

            return Ok(new
            {
                PlannerId = plannerId,
                Message = "Lesson planner created successfully."
            });
        }

        //=========================================================
        // GET BY ID
        //=========================================================

        [HttpGet("{plannerId}")]
        public async Task<IActionResult> GetPlannerById(int plannerId)
        {
            var planner = await _service.GetPlannerByIdAsync(plannerId);

            if (planner == null)
                return NotFound();

            return Ok(planner);
        }

        //=========================================================
        // GET ALL FOR CLASS
        //=========================================================

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetPlannerForClass(int classId)
        {
            var planners = await _service.GetPlannerForClassAsync(classId);

            return Ok(planners);
        }

        //=========================================================
        // UPDATE
        //=========================================================

        [HttpPut]
        public async Task<IActionResult> UpdatePlanner(
            [FromBody] UpdateLessonPlannerRequest request)
        {
            var planner = new LessonPlanner
            {
                planner_id = request.PlannerId,
                teacher_id = request.TeacherId,
                subject_id = request.SubjectId,
                class_id = request.ClassId,
                week = request.Week,
                lesson_date = request.LessonDate,
                planner_type = request.PlannerType,
                topic = request.Topic,
                assessment_type = request.AssessmentType,
                weighting = request.Weighting
            };

            bool updated = await _service.UpdatePlannerAsync(planner);

            if (!updated)
                return Forbid();

            return Ok("Lesson planner updated successfully.");
        }

        //=========================================================
        // DELETE
        //=========================================================

        [HttpDelete("{plannerId}/{teacherId}")]
        public async Task<IActionResult> DeletePlanner(
            int plannerId,
            int teacherId)
        {
            bool deleted = await _service.DeletePlannerAsync(
                plannerId,
                teacherId);

            if (!deleted)
                return Forbid();

            return Ok("Lesson planner deleted successfully.");
        }
    }
}