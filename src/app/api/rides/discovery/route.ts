import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(req: NextRequest) {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const { searchParams } = new URL(req.url);
        const search = searchParams.get("search") || "";
        const location = searchParams.get("location") || "";
        const fromDate = searchParams.get("fromDate");
        const toDate = searchParams.get("toDate");
        const limit = parseInt(searchParams.get("limit") || "10");
        const cursor = searchParams.get("cursor");

        const where: any = {
            isPublic: true,
            status: "UPCOMING",
            OR: [
                { title: { contains: search, mode: "insensitive" } },
                { description: { contains: search, mode: "insensitive" } },
                { group: { name: { contains: search, mode: "insensitive" } } },
            ],
            meetingPoint: { contains: location, mode: "insensitive" },
        };

        if (fromDate || toDate) {
            where.startTime = {};
            if (fromDate) where.startTime.gte = new Date(fromDate);
            if (toDate) where.startTime.lte = new Date(toDate);
        } else {
            where.startTime = { gte: new Date() };
        }

        const rides = await prisma.ride.findMany({
            where,
            include: {
                group: {
                    select: { name: true }
                },
                _count: {
                    select: { rsvps: { where: { status: "CONFIRMED" } } }
                }
            },
            orderBy: {
                startTime: "asc",
            },
            take: limit + 1,
            cursor: cursor ? { id: cursor } : undefined,
            skip: cursor ? 1 : 0,
        });

        let nextCursor: string | undefined = undefined;
        if (rides.length > limit) {
            const nextItem = rides.pop();
            nextCursor = nextItem?.id;
        }

        return NextResponse.json({
            rides,
            nextCursor,
        });
    } catch (error) {
        console.error("DISCOVERY_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
