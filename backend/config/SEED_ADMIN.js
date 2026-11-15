import bcrypt from 'bcrypt'; // Ensure this is at the top of your file
import dotenv from 'dotenv';
import pg from 'pg';
import path from 'path';
import { fileURLToPath } from 'url';

const { Pool } = pg;

// Recreate __dirname for the config folder
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure dotenv - looks up one level to find .env in the /backend folder
dotenv.config({ path: path.resolve(__dirname, '../.env') });

export const pool = new Pool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: String(process.env.DB_PASSWORD),
  database: process.env.DB_NAME,
  port: Number(process.env.DB_PORT),
});

async function forceUpdateAdminPassword() {
    const client = await pool.connect();
    try {
        const plainTextPassword = "1234";
        const targetUserId = 2;

        console.log(`Generating local bcrypt hash for password: "${plainTextPassword}"...`);
        // Generate the hash using your system's active cryptographic parameters
        const saltRounds = 10;
        const hashedUserPassword = await bcrypt.hash(plainTextPassword, saltRounds);
        
        console.log("Local Hash Generated successfully:", hashedUserPassword);

        const updateQuery = `
            UPDATE users 
            SET password_hash = $1 
            WHERE user_id = $2;
        `;
        
        const result = await client.query(updateQuery, [hashedUserPassword, targetUserId]);
        
        console.log("Database record updated successfully!");
        console.log(`User ID ${targetUserId} password_hash is now fully synchronized.`);

    } catch (err) {
        console.error("Failed to update administrator password hash directly:", err);
    } finally {
        client.release();
    }
}

await forceUpdateAdminPassword();
