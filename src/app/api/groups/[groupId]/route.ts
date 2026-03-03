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
                            select: { id: true, name: true, image: true, vehicleTypes: true, vehicleExperience: true },
                        },
                    },
                },
                rides: {
                    orderBy: { startTime: "asc" },
                },
            },
        });

        if (!group) return new NextResponse("Group not found", { status: 404 });

        const isCreator = group.creatorId === user.id;
        const membership = group.memberships.find((m: any) => m.userId === user.id);
        const isPlatformAdmin = user.role === "PARTICIPANT" || user.role === "PLATFORM_ADMIN";
        const isAdmin = isPlatformAdmin || membership?.role === "ADMIN";

        // If group is not approved, only creator and platform admins can see it
        if (group.status !== "APPROVED" && !isCreator && !isPlatformAdmin) {
            return new NextResponse("Group not yet approved", { status: 403 });
        }

        if (!membership && group.joinPolicy === "REQUEST_ONLY" && !isPlatformAdmin) {
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
            isPlatformAdmin,
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

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!isPlatformAdmin) {
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
        }

        const body = await req.json();
        const { name, description, joinPolicy, status: newStatus } = body;

        // If status is being updated, verify requester is a PLATFORM_ADMIN
        if (newStatus && !isPlatformAdmin) {
            return new NextResponse("Forbidden: Only platform admins can update group status", { status: 403 });
        }

        const group = await prisma.group.update({
            where: { id: groupId },
            data: {
                name,
                description,
                joinPolicy,
                status: newStatus
            },
            include: { creator: { select: { id: true, name: true } } }
        });

        // NOTIFICATION: Notify creator when status is updated
        if (newStatus && (newStatus === "APPROVED" || newStatus === "REJECTED")) {
            await prisma.notification.create({
                data: {
                    userId: group.creatorId,
                    type: "GROUP_JOIN", // Re-using group join or could use a new type
                    title: `Group ${newStatus === "APPROVED" ? "Approved" : "Status Update"}`,
                    message: newStatus === "APPROVED"
                        ? `Congratulations! Your group "${group.name}" has been approved.`
                        : `We're sorry, but your group "${group.name}" was not approved at this time.`,
                    relatedId: group.id
                }
            });
        }

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

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!isPlatformAdmin) {
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
        }

        // Get ride IDs for notification cleanup
        const rides = await prisma.ride.findMany({
            where: { groupId },
            select: { id: true },
        });
        const rideIds = rides.map((r: any) => r.id);

        await prisma.$transaction([
            // Delete notifications related to this group or its rides
            prisma.notification.deleteMany({
                where: {
                    OR: [
                        { relatedId: groupId },
                        { relatedId: { in: rideIds } }
                    ]
                }
            }),
            // Use database-level cascade delete for everything else
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
