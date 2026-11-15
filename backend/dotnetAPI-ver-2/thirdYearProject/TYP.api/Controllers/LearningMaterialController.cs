using Microsoft.AspNetCore.Mvc;
using TYP.Application.DTOs;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class LearningMaterialController : ControllerBase
    {
        private readonly ILearningMaterialService _service;

        public LearningMaterialController(ILearningMaterialService service)
        {
            _service = service;
        }

        //========================================================
        // Upload Material
        //========================================================

        [HttpPost]
        public async Task<IActionResult> Upload(
            [FromForm] UploadLearningMaterialRequest request)
        {
            var material = new LearningMaterial
            {
                title = request.Title,
                subject_id = request.SubjectId,
                grade = request.Grade,
                class_id = request.ClassId,
                teacher_id = request.TeacherId
            };

            int id = await _service.UploadMaterialAsync(
                material,
                request.File);

            return Ok(new
            {
                MaterialId = id,
                Message = "Learning material uploaded successfully."
            });
        }

        //========================================================
        // Get Material By Id
        //========================================================

        [HttpGet("{id}")]
        public async Task<IActionResult> GetById(int id)
        {
            var material = await _service.GetMaterialByIdAsync(id);

            if (material == null)
                return NotFound();

            return Ok(material);
        }

        //========================================================
        // Get Materials For Class
        //========================================================

        [HttpGet("class/{classId}")]
        public async Task<IActionResult> GetForClass(int classId)
        {
            var materials =
                await _service.GetMaterialsForClassAsync(classId);

            return Ok(materials);
        }

        //========================================================
        // Update
        //========================================================

        [HttpPut]
        public async Task<IActionResult> Update(
            [FromForm] UpdateLearningMaterialRequest request)
        {
            var material = new LearningMaterial
            {
                material_id = request.MaterialId,
                title = request.Title,
                subject_id = request.SubjectId,
                grade = request.Grade,
                class_id = request.ClassId,
                teacher_id = request.TeacherId
            };

            bool updated =
                await _service.UpdateMaterialAsync(
                    material,
                    request.File,
                    request.TeacherId);

            if (!updated)
                return Forbid();

            return Ok("Learning material updated successfully.");
        }

        //========================================================
        // Delete
        //========================================================

        [HttpDelete("{materialId}/{teacherId}")]
        public async Task<IActionResult> Delete(
            int materialId,
            int teacherId)
        {
            bool deleted =
                await _service.DeleteMaterialAsync(
                    materialId,
                    teacherId);

            if (!deleted)
                return Forbid();

            return Ok("Learning material deleted successfully.");
        }
        //GET TEACHER ASSIGNMENTS
        [HttpGet("teacher/{teacherId}")]
        public async Task<IActionResult> GetTeacherAssignments(
                int teacherId)
        {
            var assignments =
                await _service.GetTeacherAssignmentsAsync(
                    teacherId);

            return Ok(assignments);
        }


        [HttpGet("learner/{learnerId}")]
        public async Task<IActionResult> GetLearnerEnrollments(
    int learnerId)
        {
            var enrollments =
                await _service.GetLearnerEnrollmentsAsync(
                    learnerId);

            return Ok(enrollments);
        }

        //========================================================
        // RECORD MATERIAL OPEN
        //========================================================
        [HttpPost("{materialId}/open")]
        public async Task<IActionResult> RecordMaterialOpen(
      int materialId)
        {
            if (!Request.Headers.TryGetValue("X-User-Id", out var userIdValue))
            {
                return Unauthorized(new
                {
                    Message = "User ID header missing."
                });
            }

            if (!int.TryParse(userIdValue, out int learnerId))
            {
                return Unauthorized(new
                {
                    Message = "Invalid User ID."
                });
            }

            var material =
                await _service.GetMaterialByIdAsync(materialId);

            if (material == null)
            {
                return NotFound(new
                {
                    Message = "Learning material not found."
                });
            }

            await _service.RecordMaterialOpenAsync(
                learnerId,
                materialId);

            return Ok(new
            {
                Message = "Material open recorded successfully."
            });
        }

    }


}