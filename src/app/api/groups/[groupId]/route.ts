import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const group = await prisma.group.findUnique({
            where: { id: groupId },
            include: {
                creator: {
                    select: { id: true, name: true, image: true },
                },
                memberships: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true, bikeTypes: true, ridingExperience: true },
                        },
                    },
                },
                rides: {
                    orderBy: { startTime: "asc" },
                },
            },
        });

        if (!group) return new NextResponse("Group not found", { status: 404 });

        // Check if user is a member
        const membership = group.memberships.find(m => m.userId === user.id);
        const isAdmin = membership?.role === "ADMIN";

        if (!membership && group.joinPolicy === "REQUEST_ONLY") {
            // Return limited info if not public
            return NextResponse.json({
                id: group.id,
                name: group.name,
                description: group.description,
                isPublic: (group.joinPolicy as any) === "OPEN",
                isMember: false,
                inviteCode: group.inviteCode,
            });
        }

        return NextResponse.json({
            ...group,
            isMember: !!membership,
            isAdmin,
            myStatus: membership?.status,
        });
    } catch (error) {
        console.error("GROUP_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const membership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });

        if (!membership || membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { name, description, joinPolicy } = body;

        const group = await prisma.group.update({
            where: { id: groupId },
            data: { name, description, joinPolicy },
        });

        return NextResponse.json(group);
    } catch (error) {
        console.error("GROUP_PATCH_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const membership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });

        if (!membership || membership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        // Manual cascade delete because Prisma schema doesn't have onDelete: Cascade
        const rides = await prisma.ride.findMany({
            where: { groupId },
            select: { id: true },
        });
        const rideIds = rides.map((r) => r.id);

        await prisma.$transaction([
            // Delete RSVPs for all rides in this group
            prisma.rSVP.deleteMany({
                where: { rideId: { in: rideIds } },
            }),
            // Delete Messages for all rides in this group
            prisma.message.deleteMany({
                where: { rideId: { in: rideIds } },
            }),
            // Delete all rides in this group
            prisma.ride.deleteMany({
                where: { groupId },
            }),
            // Delete all memberships in this group
            prisma.membership.deleteMany({
                where: { groupId },
            }),
            // Finally delete the group
            prisma.group.delete({
                where: { id: groupId },
            }),
        ]);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("GROUP_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
