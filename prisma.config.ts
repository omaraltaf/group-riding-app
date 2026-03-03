import "dotenv/config";
import { defineConfig } from "prisma/config";

const getDatabaseUrl = () => {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return undefined;

    // Feature branch database switching
    if (process.env.VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
        process.env.VERCEL_GIT_COMMIT_REF === 'update-vehicle-type' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'update-vehicle-type') {
        url = url.replace(/ep-[^.]+/, 'ep-long-leaf-aisgx9c1');
    }

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
