const { Pool } = require('pg');
const pool = new Pool({
    connectionString: "postgresql://neondb_owner:npg_hwHKXU1cO5rg@ep-bold-leaf-aiww3fi8-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require"
});

async function check() {
    try {
        const res = await pool.query('SELECT email, name, role FROM "User" LIMIT 5');
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
