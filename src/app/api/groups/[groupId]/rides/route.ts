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
        const {
            title,
            description,
            startTime,
            endTime,
            meetingPoint,
            itinerary,
            terrainDifficulty,
            suitableBikes,
            riderCap,
            isPublic,
            destination,
            destinationUrl,
            meetingPointUrl,
        } = body;

        const ride = await prisma.ride.create({
            data: {
                title,
                description,
                startTime: new Date(startTime),
                endTime: endTime ? new Date(endTime) : null,
                meetingPoint,
                itinerary,
                terrainDifficulty,
                suitableBikes,
                riderCap: riderCap ? parseInt(riderCap) : null,
                isPublic: !!isPublic,
                groupId: groupId,
                creatorId: user.id,
                destination,
                destinationUrl,
                meetingPointUrl,
            },
        });

        return NextResponse.json(ride);
    } catch (error) {
        console.error("RIDE_CREATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const rides = await prisma.ride.findMany({
            where: { groupId: groupId },
            orderBy: { startTime: "asc" },
            include: {
                _count: {
                    select: { rsvps: true }
                }
            }
        });

        return NextResponse.json(rides);
    } catch (error) {
        console.error("RIDES_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
