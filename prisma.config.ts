import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return undefined;

    // 1. Derivation: Handle Neon pooled URLs
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");
    }

    // 2. Aggressive Locking Bypass: Use pgbouncer=true to skip advisory locks.
    // 3. Robust Parameter Handling: Use URL split/join for safety.
    try {
        const [base, params] = url.split("?");
        const searchParams = new URLSearchParams(params || "");

        searchParams.set("pgbouncer", "true");
        searchParams.set("connect_timeout", "60");
        searchParams.set("pool_timeout", "60");

        return `${base}?${searchParams.toString()}`;
    } catch (e) {
        console.warn("Failed to parse database URL for parameters, using raw URL.");
        return url;
    }
};

const finalUrl = getDatabaseUrl();

// Side-effect: Ensure the environment variable is updated for the migration engine.
if (finalUrl) {
    process.env.DATABASE_URL = finalUrl;
}

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "npx tsx prisma/seed.ts",
    },
    datasource: {
        url: finalUrl,
    },
});
