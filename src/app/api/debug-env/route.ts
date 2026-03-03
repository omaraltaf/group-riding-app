import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const dbUrl = process.env.DATABASE_URL || "";
    const maskedUrl = dbUrl.replace(/\/\/[^:]+:[^@]+@/, "//***:***@");
    const host = dbUrl.split('@')[1]?.split('/')[0] || "unknown";

    return NextResponse.json({
        VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || "not set",
        NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || "not set",
        NODE_ENV: process.env.NODE_ENV,
        dbHost: host,
        maskedUrl: maskedUrl,
        // Check if prisma can reach the DB
        dbReach: await (async () => {
            try {
                const count = await prisma.user.count();
                return `Success - ${count} users found`;
            } catch (e: any) {
                return `Failed - ${e.message}`;
            }
        })()
    });
}
