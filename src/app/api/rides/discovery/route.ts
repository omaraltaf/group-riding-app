import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET() {
    try {
        const user = await getCurrentUser();
        if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

        const rides = await prisma.ride.findMany({
            where: {
                isPublic: true,
                startTime: {
                    gte: new Date(), // Only future rides
                },
            },
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
            take: 20,
        });

        return NextResponse.json(rides);
    } catch (error) {
        console.error("DISCOVERY_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
