import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
import { nanoid } from "nanoid";

export async function POST(req: Request) {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const body = await req.json();
        const { name, description, joinPolicy, category } = body;

        if (!name) {
            return new NextResponse("Name is required", { status: 400 });
        }

        const inviteCode = nanoid(10);

        const group = await prisma.group.create({
            data: {
                name,
                description,
                joinPolicy: joinPolicy || "REQUEST_ONLY",
                category: category || "BIKES",
                status: "PENDING",
                inviteCode,
                creatorId: user.id,
                memberships: {
                    create: {
                        userId: user.id,
                        role: "ADMIN",
                        status: "APPROVED",
                    },
                },
            },
            include: {
                memberships: true,
            },
        });

        // NOTIFICATION: Notify all PLATFORM_ADMINs about the new group creation request
        const platformAdmins = await prisma.user.findMany({
            where: { role: "PLATFORM_ADMIN" },
            select: { id: true }
        });

        if (platformAdmins.length > 0) {
            await prisma.notification.createMany({
                data: platformAdmins.map(admin => ({
                    userId: admin.id,
                    type: "GROUP_CREATE_REQUEST",
                    title: "New Group Approval Required",
                    message: `A new group "${name}" has been created and requires your approval.`,
                    relatedId: group.id
                }))
            });
        }

        return NextResponse.json(group);
    } catch (error) {
        console.error("GROUP_CREATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET() {
    try {
        const user = await getCurrentUser();

        if (!user) {
            return new NextResponse("Unauthorized", { status: 401 });
        }

        const groups = await prisma.group.findMany({
            where: {
                memberships: {
                    some: {
                        userId: user.id,
                        status: "APPROVED",
                    },
                },
            },
            include: {
                _count: {
                    select: {
                        memberships: {
                            where: { status: "APPROVED" },
                        },
                        trips: true,
                    },
                },
            },
            orderBy: {
                createdAt: "desc",
            },
        });

        return NextResponse.json(groups);
    } catch (error) {
        console.error("GROUPS_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
