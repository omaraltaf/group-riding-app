import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return undefined;

    // If we're performing a migration and it's a Neon pooled URL,
    // automatically derive the direct URL and clean up pooled params.
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");

        // Remove pgbouncer=true which can interfere with migrations even on direct hosts
        url = url.replace("pgbouncer=true", "pgbouncer=false");

        // Add a more generous timeout for the initial connection/lock acquisition
        const separator = url.includes("?") ? "&" : "?";
        if (!url.includes("connect_timeout=")) {
            url += `${separator}connect_timeout=30`;
        }
    }

    return url;
};

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations",
        seed: "npx tsx prisma/seed.ts",
    },
    datasource: {
        url: getDatabaseUrl(),
    },
});
