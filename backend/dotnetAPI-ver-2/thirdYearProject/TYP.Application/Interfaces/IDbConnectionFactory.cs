using System;
using System.Collections.Generic;
using System.Data;
using System.Text;

namespace TYP.Application.Interfaces
{
    public interface IDbConnectionFactory
    {
        IDbConnection CreateConnection(); //connection to the postgresql datbase on supabase

    }
}
