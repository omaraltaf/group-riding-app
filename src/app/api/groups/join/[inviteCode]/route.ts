import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ inviteCode: string }> }
) {
    const { inviteCode } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const group = await prisma.group.findFirst({
            where: { inviteCode: inviteCode },
        });

        if (!group) return new NextResponse("Group not found", { status: 404 });

        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: group.id,
                },
            },
        });

        if (existingMembership) {
            if (existingMembership.status === "APPROVED") {
                return NextResponse.json({ groupId: group.id, status: "ALREADY_MEMBER" });
            }
            return NextResponse.json({ groupId: group.id, status: "PENDING" });
        }

        const status = group.joinPolicy === "OPEN" ? "APPROVED" : "PENDING";

        await prisma.membership.create({
            data: {
                userId: user.id,
                groupId: group.id,
                status,
                role: "MEMBER",
            },
        });

        // NOTIFICATION: Notify user they joined
        if (status === "APPROVED") {
            await prisma.notification.create({
                data: {
                    userId: user.id,
                    type: "GROUP_JOIN",
                    title: "Welcome to the Group!",
                    message: `You have successfully joined "${group.name}" via invite code.`,
                    relatedId: group.id,
                },
            });
        }

        return NextResponse.json({ groupId: group.id, status });
    } catch (error) {
        console.error("INVITE_JOIN_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
