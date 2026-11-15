using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using System;
using System.Collections.Generic;
using System.Text;
using TYP.Application.Interfaces;
using TYP.Infrastructure.Repository;

namespace TYP.Infrastructure.Data
{
    public static class DependencyInjection
    {

        public static IServiceCollection AddInfrastructure(this IServiceCollection services,IConfiguration configuration)
        {
            services.AddScoped<IDbConnectionFactory, DbConnectionFactory>();
            services.AddScoped<IAnnouncementRepository, AnnouncementRepository>();
            services.AddScoped<ILearningMaterialRepository, LearningMaterialRepository>();
            services.AddScoped<ILessonPlannerRepository, LessonPlannerRepository>();
            return services;
        }

    }
}
