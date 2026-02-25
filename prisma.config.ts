import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
    const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return undefined;

    // If we're performing a migration/generate and it's a Neon pooled URL,
    // automatically derive the direct URL to avoid P1002/P1003 errors.
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        return url.replace("-pooler", "");
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
