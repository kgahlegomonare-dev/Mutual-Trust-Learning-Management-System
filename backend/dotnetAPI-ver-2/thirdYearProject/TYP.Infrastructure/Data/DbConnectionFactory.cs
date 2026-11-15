using Microsoft.Extensions.Configuration;
using Npgsql;
using System;
using System.Collections.Generic;
using System.Data;
using System.Text;
using TYP.Application.Interfaces;

namespace TYP.Infrastructure.Data
{
    public class DbConnectionFactory :IDbConnectionFactory
    {
        private readonly IConfiguration _configuration;
        public DbConnectionFactory(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public IDbConnection CreateConnection()
        {
            var connection = _configuration.GetConnectionString("DefaultConnection");
            if(connection == null)
            {
                throw new Exception("connection string is empty");
            }
            NpgsqlConnection dbConnection = new NpgsqlConnection(connection);
            return dbConnection;
        }
    }
}
