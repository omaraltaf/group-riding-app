import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return undefined;

    // If we're performing a migration and it's a Neon pooled URL,
    // automatically derive the direct URL and clean up host.
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");
    }

    // WORKAROUND: Force pgbouncer=true to skip advisory locks during migration.
    // This resolves the P1002 timeout even on direct connections if the DB is under load
    // or has stale locks.
    const separator = url.includes("?") ? "&" : "?";
    if (!url.includes("pgbouncer=")) {
        url += `${separator}pgbouncer=true`;
    } else if (url.includes("pgbouncer=false")) {
        url = url.replace("pgbouncer=false", "pgbouncer=true");
    }

    // Add a generous timeout for the initial connection
    if (!url.includes("connect_timeout=")) {
        const nextSeparator = url.includes("?") ? "&" : "?";
        url += `${nextSeparator}connect_timeout=30`;
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
