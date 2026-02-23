import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const notifications = await prisma.notification.findMany({
            where: { userId: user.id },
            orderBy: { createdAt: "desc" },
            take: 20,
        });

        return NextResponse.json(notifications);
    } catch (error) {
        console.error("NOTIFICATIONS_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PATCH(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const body = await req.json();
        const { notificationId } = body;

        const notification = await prisma.notification.update({
            where: {
                id: notificationId,
                userId: user.id, // Security check
            },
            data: { isRead: true },
        });

        return NextResponse.json(notification);
    } catch (error) {
        console.error("NOTIFICATION_PATCH_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
