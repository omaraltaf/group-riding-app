import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: Request) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const query = searchParams.get("q") || "";
        const category = searchParams.get("category");

        const where: any = {
            status: "APPROVED",
            OR: [
                { name: { contains: query, mode: "insensitive" } },
                { description: { contains: query, mode: "insensitive" } },
            ],
        };

        if (category && category !== "ALL") {
            where.category = category;
        }

        const groups = await prisma.group.findMany({
            where,
            include: {
                _count: {
                    select: {
                        memberships: {
                            where: { status: "APPROVED" },
                        },
                        trips: true,
                    },
                },
                memberships: {
                    where: { userId: user.id },
                    select: { status: true, role: true }
                }
            },
            orderBy: {
                createdAt: "desc",
            },
            take: 50,
        });

        const formattedGroups = groups.map((group: any) => ({
            ...group,
            myStatus: group.memberships[0]?.status || null,
            myRole: group.memberships[0]?.role || null,
            // Remove full memberships array from response
            memberships: undefined
        }));

        return NextResponse.json(formattedGroups);
    } catch (error) {
        console.error("GROUP_DISCOVERY_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
