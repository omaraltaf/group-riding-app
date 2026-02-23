import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const group = await prisma.group.findUnique({
            where: { id: groupId },
        });

        if (!group) return new NextResponse("Group not found", { status: 404 });

        const existingMembership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });

        if (existingMembership) {
            return new NextResponse("Already a member or request pending", { status: 400 });
        }

        const status = group.joinPolicy === "OPEN" ? "APPROVED" : "PENDING";

        const membership = await prisma.membership.create({
            data: {
                userId: user.id,
                groupId: groupId,
                status,
                role: "MEMBER",
            },
        });

        return NextResponse.json(membership);
    } catch (error) {
        console.error("GROUP_JOIN_ERROR", error);
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

        const myMembership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });

        if (!myMembership || myMembership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const body = await req.json();
        const { userId, status, role } = body;

        const updatedMembership = await prisma.membership.update({
            where: {
                userId_groupId: {
                    userId,
                    groupId: groupId,
                },
            },
            data: { status, role },
        });

        return NextResponse.json(updatedMembership);
    } catch (error) {
        console.error("MEMBERSHIP_PATCH_ERROR", error);
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

        const url = new URL(req.url);
        const targetUserId = url.searchParams.get("userId") || user.id;

        const myMembership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: groupId,
                },
            },
        });

        if (!myMembership) return new NextResponse("Forbidden", { status: 403 });

        // Can only delete yourself, unless you are an admin deleting someone else
        if (targetUserId !== user.id && myMembership.role !== "ADMIN") {
            return new NextResponse("Forbidden", { status: 403 });
        }

        await prisma.membership.delete({
            where: {
                userId_groupId: {
                    userId: targetUserId,
                    groupId: groupId,
                },
            },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("MEMBERSHIP_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
