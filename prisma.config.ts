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

    return url;
};

const finalUrl = getDatabaseUrl();

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
