const { Pool } = require('pg');

const connectionString = "postgresql://neondb_owner:npg_hwHKXU1cO5rg@ep-long-leaf-aisgx9c1-pooler.c-4.us-east-1.aws.neon.tech/neondb?sslmode=require";
const pool = new Pool({ connectionString });

async function check() {
    try {
        const res = await pool.query('SELECT NOW()');
        console.log('RESULTS_START');
        console.log('Successfully connected to ep-long-leaf-aisgx9c1 using production password');
        console.log('RESULTS_END');
    } catch (err) {
        console.error('Connection failed:', err.message);
    } finally {
        await pool.end();
    }
}

check();
