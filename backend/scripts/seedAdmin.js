const { pool } = require('../config/db');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: require('path').resolve(__dirname, '../.env') });

const seedAdmin = async () => {
  const admin = {
    first_name: 'Super',
    last_name: 'Admin',
    email: 'admin@mutualtrust.com',
    password: 'Admin@1234',
    phone_number: '0000000000',
    id_number: '0000000000000',
    role: 'Admin',
    center_id: '1',
    address: 'Head Office'
  };

  try {
    // Check if admin already exists
    const existing = await pool.query(
      'SELECT email FROM users WHERE LOWER(email) = LOWER($1)',
      [admin.email]
    );

    if (existing.rows.length > 0) {
      console.log('⚠️  Seed admin already exists. Skipping.');
      process.exit(0);
    }

    const password_hash = await bcrypt.hash(admin.password, 10);

    await pool.query(
      `INSERT INTO users 
        (first_name, last_name, email, password_hash, phone_number, id_number, role, center_id, address, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, true)`,
      [
        admin.first_name,
        admin.last_name,
        admin.email,
        password_hash,
        admin.phone_number,
        admin.id_number,
        admin.role,
        admin.center_id,
        admin.address

      ]
    );

    console.log('✅ Seed admin created successfully!');
    console.log('-----------------------------------');
    console.log(`   Email   : ${admin.email}`);
    console.log(`   Password: ${admin.password}`);
    console.log('-----------------------------------');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error seeding admin:', error.message);
    process.exit(1);
  }
};

seedAdmin();