
using Microsoft.AspNetCore.Http;
using System.Data;
using TYP.Application.DTOs;
using TYP.Application.Interfaces;
using TYP.Domain.Entities;

namespace TYP.Application.Services
{
    public class LearningMaterialService : ILearningMaterialService
    {
        private readonly ILearningMaterialRepository _repo;
        private readonly IDbConnectionFactory _db;

        public LearningMaterialService( ILearningMaterialRepository repo,IDbConnectionFactory db)
        {
            _repo = repo;
            _db = db;
        }

        public async Task<int> UploadMaterialAsync(
            LearningMaterial material,
            IFormFile file)
        {
            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                // Save uploaded file
                string filePath = await SaveFileAsync(file);

                material.file_name = file.FileName;
                material.file_path = filePath;
                material.file_type = file.ContentType;
                material.file_size = file.Length;

                int materialId = await _repo.UploadMaterialAsync(
                    connection,
                    transaction,
                    material);

                transaction.Commit();

                return materialId;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<LearningMaterial?> GetMaterialByIdAsync(
            int materialId)
        {
            return await _repo.GetMaterialByIdAsync(materialId);
        }

        public async Task<ICollection<LearningMaterial>> GetMaterialsForClassAsync(
            int classId)
        {
            return await _repo.GetMaterialsForClassAsync(classId);
        }
        public async Task<bool> UpdateMaterialAsync(
    LearningMaterial material,
    IFormFile? newFile,
    int teacherId)
        {
            bool owner = await _repo.IsMaterialOwnerAsync(
                material.material_id,
                teacherId);

            if (!owner)
                return false;

            var existingMaterial =
                await _repo.GetMaterialByIdAsync(material.material_id);

            if (existingMaterial == null)
                return false;

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                if (newFile != null)
                {
                    DeleteFileIfExists(existingMaterial.file_path);

                    string newPath = await SaveFileAsync(newFile);

                    material.file_name = newFile.FileName;
                    material.file_path = newPath;
                    material.file_type = newFile.ContentType;
                    material.file_size = newFile.Length;
                }
                else
                {
                    material.file_name = existingMaterial.file_name;
                    material.file_path = existingMaterial.file_path;
                    material.file_type = existingMaterial.file_type;
                    material.file_size = existingMaterial.file_size;
                }

                await _repo.UpdateMaterialAsync(
                    connection,
                    transaction,
                    material);

                transaction.Commit();

                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        public async Task<bool> DeleteMaterialAsync(
            int materialId,
            int teacherId)
        {
            bool owner = await _repo.IsMaterialOwnerAsync(
                materialId,
                teacherId);

            if (!owner)
                return false;

            var material =
                await _repo.GetMaterialByIdAsync(materialId);

            if (material == null)
                return false;

            using var connection = _db.CreateConnection();
            connection.Open();

            using var transaction = connection.BeginTransaction();

            try
            {
                DeleteFileIfExists(material.file_path);

                await _repo.DeleteMaterialAsync(
                    connection,
                    transaction,
                    materialId);

                transaction.Commit();

                return true;
            }
            catch
            {
                transaction.Rollback();
                throw;
            }
        }

        //========================================================
        // PRIVATE HELPERS
        //========================================================

        private async Task<string> SaveFileAsync(IFormFile file)
        {
            string uploadsFolder = Path.Combine( Directory.GetCurrentDirectory(), "Uploads","LearningMaterials");

            if (!Directory.Exists(uploadsFolder))
            {
                Directory.CreateDirectory(uploadsFolder);
            }

            string extension = Path.GetExtension(file.FileName);

            string uniqueFileName =
                $"{Guid.NewGuid()}{extension}";

            string fullPath = Path.Combine(
                uploadsFolder,
                uniqueFileName);

            using var stream = new FileStream(
                fullPath,
                FileMode.Create);

            await file.CopyToAsync(stream);

            return Path.Combine(
                "Uploads",
                "LearningMaterials",
                uniqueFileName)
                .Replace("\\", "/");
        }

        private void DeleteFileIfExists(string filePath)
        {
            string fullPath = Path.Combine(Directory.GetCurrentDirectory(),filePath);

            if (File.Exists(fullPath))
            {
                File.Delete(fullPath);
            }
        }

        public async Task<ICollection<TeacherAssignmentResponse>>
           GetTeacherAssignmentsAsync(int teacherId)
        {
            return await _repo.GetTeacherAssignmentsAsync(teacherId);
        }

        public async Task<ICollection<LearnerEnrollmentDto>> GetLearnerEnrollmentsAsync(int learnerId)
        {
            return await _repo.GetLearnerEnrollmentsAsync(learnerId);
        }

        //========================================================
        // MATERIAL OPEN TRACKING
        //========================================================

        public async Task RecordMaterialOpenAsync(
            int learnerId,
            int materialId)
        {
            await _repo.RecordMaterialOpenAsync(
                learnerId,
                materialId);
        }
    }
}