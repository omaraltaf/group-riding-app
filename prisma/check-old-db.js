const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_k7yhTPtlwz4s@ep-wispy-night-a1jl5kxp-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const pool = new Pool({ connectionString });

async function check() {
    try {
        const res = await pool.query('SELECT email, name, role FROM "User" LIMIT 10');
        console.log('RESULTS_START');
        console.log(JSON.stringify(res.rows, null, 2));
        console.log('RESULTS_END');
    } catch (err) {
        console.error(err);
    } finally {
        await pool.end();
    }
}

check();
