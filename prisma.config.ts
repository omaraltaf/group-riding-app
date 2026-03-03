import "dotenv/config";
import { defineConfig } from "prisma/config";

import { getConfiguredDatabaseUrl } from "./src/lib/db-utils";

const finalUrl = getConfiguredDatabaseUrl(process.env.DIRECT_URL || process.env.DATABASE_URL);

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
