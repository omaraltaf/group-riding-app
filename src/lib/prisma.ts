import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const globalForPrisma = globalThis as unknown as {
    prisma: PrismaClient | undefined;
};

let connectionString = process.env.DATABASE_URL;

// Feature branch database switching
if (process.env.VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
    process.env.VERCEL_GIT_COMMIT_REF === 'update-vehicle-type' ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'update-vehicle-type') {
    connectionString = connectionString?.replace(/ep-[^.]+/, 'ep-long-leaf-aisgx9c1');
}

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

export const prisma =
    globalForPrisma.prisma ??
    new PrismaClient({
        adapter,
        log: process.env.NODE_ENV === "development" ? ["query", "error", "warn"] : ["error"],
    });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
