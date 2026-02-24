import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function PATCH(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, phone, bikeTypes, ridingExperience, image, pushOptIn, targetUserId } = body;

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";
        const finalUserId = (isPlatformAdmin && targetUserId) ? targetUserId : user.id;

        const updatedUser = await prisma.user.update({
            where: { id: finalUserId },
            data: {
                name,
                phone: phone === "" ? null : phone,
                bikeTypes,
                ridingExperience,
                image,
                pushOptIn: typeof pushOptIn === 'boolean' ? pushOptIn : undefined,
            },
        });

        return NextResponse.json(updatedUser);
    } catch (error) {
        console.error("PROFILE_UPDATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
