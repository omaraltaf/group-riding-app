import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const userData = await prisma.user.findUnique({
            where: { id: user.id },
        });

        if (!userData) {
            return new NextResponse("User not found", { status: 404 });
        }

        const { password: _, ...userWithoutPassword } = userData;
        return NextResponse.json(userWithoutPassword);
    } catch (error) {
        console.error("GET_PROFILE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
