import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ userId: string }> }
) {
    const { userId } = await params;
    try {
        const currentUser = await getCurrentUser();
        if (!currentUser) return new NextResponse("Unauthorized", { status: 401 });

        // Only allow if it's the user themselves OR a platform admin
        if (currentUser.id !== userId && currentUser.role !== "PLATFORM_ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const user = await prisma.user.findUnique({
            where: { id: userId },
            select: {
                id: true,
                name: true,
                email: true,
                phone: true,
                image: true,
                vehicleExperience: true,
                vehicleTypes: true,
                role: true,
                pushOptIn: true,
                createdAt: true,
            },
        });

        if (!user) return new NextResponse("User not found", { status: 404 });

        return NextResponse.json(user);
    } catch (error) {
        console.error("PROFILE_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
