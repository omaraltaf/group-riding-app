const { Pool } = require('pg');
const bcrypt = require('bcryptjs');

const connectionString = "postgresql://neondb_owner:npg_hwHKXU1cO5rg@ep-long-leaf-aisgx9c1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

async function verify() {
    try {
        const res = await pool.query('SELECT password FROM "User" WHERE email = $1', ['user1@example.com']);
        if (res.rows.length === 0) {
            console.log('User not found');
            return;
        }
        const hashed = res.rows[0].password;

        // Check for common test passwords
        const isPassword123 = await bcrypt.compare('password123', hashed);

        console.log('RESULTS_START');
        console.log(`Email: user1@example.com`);
        console.log(`Password 'password123' match: ${isPassword123}`);
        console.log('Hash: ' + hashed);
        console.log('RESULTS_END');
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

verify();
