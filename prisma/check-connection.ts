import { Client } from "pg";
import "dotenv/config";

async function check() {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) {
        console.error("No DATABASE_URL found");
        process.exit(1);
    }

    console.log("Original URL Host:", new URL(url).hostname);

    if (url.includes("-pooler")) {
        url = url.replace("-pooler", "");
        console.log("Derived Direct URL Host:", new URL(url).hostname);
    }

    const client = new Client({ connectionString: url });

    try {
        console.log("Attempting to connect...");
        await client.connect();
        console.log("✅ Connected successfully!");

        console.log("Checking for active advisory locks...");
        const res = await client.query("SELECT * FROM pg_locks WHERE locktype = 'advisory'");
        console.log(`Found ${res.rowCount} active advisory locks.`);
        if (res.rowCount > 0) {
            console.log(res.rows);
        }

        console.log("Testing advisory lock acquisition...");
        try {
            const lockRes = await client.query("SELECT pg_try_advisory_lock(72707369)");
            console.log("Lock acquisition result:", lockRes.rows[0]);
            await client.query("SELECT pg_advisory_unlock(72707369)");
            console.log("Lock released.");
        } catch (lockErr) {
            console.error("❌ Failed to acquire test advisory lock:", lockErr);
        }

    } catch (err) {
        console.error("❌ Connection failed:", err);
    } finally {
        await client.end();
    }
}

check();
