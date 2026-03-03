const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_hwHKXU1cO5rg@ep-long-leaf-aisgx9c1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

async function check() {
    try {
        const res = await pool.query('SELECT email FROM "User" WHERE email = $1', ['omaraltaf@gmail.com']);
        console.log('RESULTS_START');
        if (res.rows.length > 0) {
            console.log('User omaraltaf@gmail.com FOUND in long-leaf');
        } else {
            console.log('User omaraltaf@gmail.com NOT FOUND in long-leaf');
        }
        console.log('RESULTS_END');
    } catch (err) {
        console.error('Check failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
