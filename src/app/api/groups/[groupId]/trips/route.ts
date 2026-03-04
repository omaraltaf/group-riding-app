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
        const {
            title,
            description,
            startTime,
            endTime,
            meetingPoint,
            itinerary,
            terrainDifficulty,
            suitableVehicles,
            participantCap,
            isPublic,
            destination,
            destinationUrl,
            meetingPointUrl,
            category,
        } = body;

        const tripStartTime = startTime ? new Date(startTime) : new Date();
        const tripEndTime = endTime ? new Date(endTime) : null;

        // Basic validation to prevent 500 errors
        if (tripStartTime.toString() === "Invalid Date") {
            return new NextResponse("Invalid start time", { status: 400 });
        }

        const parsedParticipantCap = participantCap ? parseInt(participantCap) : null;
        if (participantCap && isNaN(parsedParticipantCap as number)) {
            return new NextResponse("Invalid participant capacity", { status: 400 });
        }

        const trip = await prisma.trip.create({
            data: {
                title: title || "New Trip",
                description: description || "",
                startTime: tripStartTime,
                endTime: tripEndTime,
                meetingPoint: meetingPoint || "",
                itinerary: itinerary || "",
                terrainDifficulty: terrainDifficulty || "Medium",
                category: category || "BIKES",
                suitableVehicles: suitableVehicles || "",
                participantCap: (participantCap && !isNaN(parsedParticipantCap as number)) ? parsedParticipantCap : null,
                isPublic: !!isPublic,
                groupId: groupId,
                creatorId: user.id,
                destination: destination || "",
                destinationUrl: destinationUrl || "",
                meetingPointUrl: meetingPointUrl || "",
            },
            include: {
                group: { select: { name: true } },
            }
        });

        // NOTIFICATION: Notify all group members about the new trip
        const members = await prisma.membership.findMany({
            where: {
                groupId: groupId,
                status: "APPROVED",
                userId: { not: user.id }, // Don't notify the creator
            },
            select: { userId: true },
        });

        if (members.length > 0) {
            await prisma.notification.createMany({
                data: members.map((m) => ({
                    userId: m.userId,
                    type: "TRIP_NEW",
                    title: "New Trip Scheduled!",
                    message: `${user.name} posted a new trip: "${title}" in "${(trip as any).group.name}".`,
                    relatedId: trip.id,
                })),
            });
        }

        return NextResponse.json(trip);
    } catch (error) {
        console.error("TRIP_CREATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ groupId: string }> }
) {
    const { groupId } = await params;
    try {
        const trips = await prisma.trip.findMany({
            where: { groupId: groupId },
            orderBy: { startTime: "asc" },
            include: {
                _count: {
                    select: { rsvps: true }
                }
            }
        });

        return NextResponse.json(trips);
    } catch (error) {
        console.error("TRIPS_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
