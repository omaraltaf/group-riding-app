import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    return NextResponse.json({
        VERCEL_GIT_COMMIT_REF: process.env.VERCEL_GIT_COMMIT_REF || "not set",
        NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF || "not set",
        NODE_ENV: process.env.NODE_ENV,
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
