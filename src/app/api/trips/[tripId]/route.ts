import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            include: {
                group: {
                    select: { id: true, name: true, joinPolicy: true }
                },
                creator: {
                    select: { id: true, name: true }
                },
                rsvps: {
                    include: {
                        user: {
                            select: { id: true, name: true, image: true, vehicleTypes: true, vehicleExperience: true }
                        }
                    }
                },
                _count: {
                    select: { rsvps: true }
                }
            }
        });

        if (!trip) return new NextResponse("Trip not found", { status: 404 });

        // Check if user is member of the group
        const membership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: trip.groupId
                }
            }
        });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!membership && !trip.isPublic && !isPlatformAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const myRsvp = (trip as any).rsvps.find((r: any) => r.userId === user.id);

        return NextResponse.json({
            ...trip,
            isMember: !!membership,
            isAdmin: isPlatformAdmin || membership?.role === "ADMIN",
            isCreator: (trip as any).creatorId === user.id,
            myRsvp: myRsvp?.status || null,
        });
    } catch (error) {
        console.error("TRIP_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
        });

        if (!trip) return new NextResponse("Trip not found", { status: 404 });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!isPlatformAdmin) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: trip.groupId
                    }
                }
            });

            if (!membership || (membership.role !== "ADMIN" && trip.creatorId !== user.id)) {
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
            status,
            destination,
            destinationUrl,
            meetingPointUrl,
        } = body;

        const tripStartTime = startTime ? new Date(startTime) : null;
        if (tripStartTime && tripStartTime.toString() === "Invalid Date") {
            return new NextResponse("Invalid start time", { status: 400 });
        }

        const tripEndTime = endTime ? new Date(endTime) : null;
        if (tripEndTime && tripEndTime.toString() === "Invalid Date") {
            return new NextResponse("Invalid end time", { status: 400 });
        }

        const parsedParticipantCap = participantCap ? parseInt(participantCap as string) : null;
        if (participantCap !== undefined && isNaN(parsedParticipantCap as number)) {
            return new NextResponse("Invalid participant capacity", { status: 400 });
        }

        const updatedTrip = await prisma.trip.update({
            where: { id: tripId },
            data: {
                title: title === "" ? undefined : title,
                description: description === "" ? undefined : description,
                startTime: tripStartTime || undefined,
                endTime: tripEndTime || undefined,
                meetingPoint: meetingPoint === "" ? undefined : meetingPoint,
                itinerary,
                terrainDifficulty,
                suitableVehicles,
                participantCap: (participantCap !== undefined && !isNaN(parsedParticipantCap as number)) ? parsedParticipantCap : undefined,
                isPublic: isPublic !== undefined ? !!isPublic : undefined,
                status: status || undefined,
                destination: destination === "" ? undefined : destination,
                destinationUrl,
                meetingPointUrl,
            },
        });

        // NOTIFICATION: Notify all RSVP'd participants about the update
        const rsvps = await prisma.rSVP.findMany({
            where: { tripId, status: "CONFIRMED" },
            select: { userId: true }
        });

        if (rsvps.length > 0) {
            await prisma.notification.createMany({
                data: rsvps.map(r => ({
                    userId: r.userId,
                    type: "TRIP_UPDATE",
                    title: "Trip Updated",
                    message: `The trip "${updatedTrip.title}" has been updated.`,
                    relatedId: tripId
                }))
            });
        }

        return NextResponse.json(updatedTrip);
    } catch (error) {
        console.error("TRIP_UPDATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
            select: { creatorId: true, title: true, groupId: true }
        });

        if (!trip) return new NextResponse("Trip not found", { status: 404 });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (trip.creatorId !== user.id && !isPlatformAdmin) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: trip.groupId
                    }
                }
            });

            if (!membership || membership.role !== "ADMIN") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        // NOTIFICATION: Notify all RSVP'd participants about the cancellation BEFORE deleting
        const rsvps = await prisma.rSVP.findMany({
            where: { tripId, status: "CONFIRMED" },
            select: { userId: true }
        });

        const participantsToNotify = rsvps.filter(r => r.userId !== user.id);
        if (participantsToNotify.length > 0) {
            await prisma.notification.createMany({
                data: participantsToNotify.map((p) => ({
                    userId: p.userId,
                    type: "TRIP_CANCEL",
                    title: "Trip Cancelled",
                    message: `The trip "${trip.title}" has been cancelled.`,
                    relatedId: trip.groupId, // Link back to group since trip is gone
                })),
            });
        }

        await prisma.$transaction([
            // Clear notifications for this trip
            prisma.notification.deleteMany({
                where: { relatedId: tripId }
            }),
            // Delete the trip (cascades will handle RSVPs and messages)
            prisma.trip.delete({
                where: { id: tripId },
            }),
        ]);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("TRIP_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
