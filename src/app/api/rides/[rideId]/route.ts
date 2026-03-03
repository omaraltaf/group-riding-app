import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function GET(
    req: Request,
    { params }: { params: Promise<{ rideId: string }> }
) {
    const { rideId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
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

        if (!ride) return new NextResponse("Trip not found", { status: 404 });

        // Check if user is member of the group
        const membership = await prisma.membership.findUnique({
            where: {
                userId_groupId: {
                    userId: user.id,
                    groupId: ride.groupId
                }
            }
        });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!membership && !ride.isPublic && !isPlatformAdmin) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const myRsvp = (ride as any).rsvps.find((r: any) => r.userId === user.id);

        return NextResponse.json({
            ...ride,
            isMember: !!membership,
            isAdmin: isPlatformAdmin || membership?.role === "ADMIN",
            isCreator: (ride as any).creatorId === user.id,
            myRsvp: myRsvp?.status || null,
        });
    } catch (error) {
        console.error("RIDE_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function PATCH(
    req: Request,
    { params }: { params: Promise<{ rideId: string }> }
) {
    const { rideId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
        });

        if (!ride) return new NextResponse("Trip not found", { status: 404 });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (!isPlatformAdmin) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: ride.groupId
                    }
                }
            });

            if (!membership || (membership.role !== "ADMIN" && ride.creatorId !== user.id)) {
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

        const rideStartTime = startTime ? new Date(startTime) : null;
        if (rideStartTime && rideStartTime.toString() === "Invalid Date") {
            return new NextResponse("Invalid start time", { status: 400 });
        }

        const rideEndTime = endTime ? new Date(endTime) : null;
        if (rideEndTime && rideEndTime.toString() === "Invalid Date") {
            return new NextResponse("Invalid end time", { status: 400 });
        }

        const parsedParticipantCap = participantCap ? parseInt(participantCap as string) : null;
        if (participantCap !== undefined && isNaN(parsedParticipantCap as number)) {
            return new NextResponse("Invalid participant capacity", { status: 400 });
        }

        const updatedRide = await prisma.ride.update({
            where: { id: rideId },
            data: {
                title: title === "" ? undefined : title,
                description: description === "" ? undefined : description,
                startTime: rideStartTime || undefined,
                endTime: rideEndTime || undefined,
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
            where: { rideId, status: "CONFIRMED" },
            select: { userId: true }
        });

        if (rsvps.length > 0) {
            await prisma.notification.createMany({
                data: rsvps.map(r => ({
                    userId: r.userId,
                    type: "RIDE_UPDATE",
                    title: "Trip Updated",
                    message: `The trip "${updatedRide.title}" has been updated.`,
                    relatedId: rideId
                }))
            });
        }

        return NextResponse.json(updatedRide);
    } catch (error) {
        console.error("RIDE_UPDATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function DELETE(
    req: Request,
    { params }: { params: Promise<{ rideId: string }> }
) {
    const { rideId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            select: { creatorId: true, title: true, groupId: true }
        });

        if (!ride) return new NextResponse("Trip not found", { status: 404 });

        const isPlatformAdmin = user.role === "PLATFORM_ADMIN";

        if (ride.creatorId !== user.id && !isPlatformAdmin) {
            const membership = await prisma.membership.findUnique({
                where: {
                    userId_groupId: {
                        userId: user.id,
                        groupId: ride.groupId
                    }
                }
            });

            if (!membership || membership.role !== "ADMIN") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        // NOTIFICATION: Notify all RSVP'd participants about the cancellation BEFORE deleting
        const rsvps = await prisma.rSVP.findMany({
            where: { rideId, status: "CONFIRMED" },
            select: { userId: true }
        });

        const participantsToNotify = rsvps.filter(r => r.userId !== user.id);
        if (participantsToNotify.length > 0) {
            await prisma.notification.createMany({
                data: participantsToNotify.map((p) => ({
                    userId: p.userId,
                    type: "RIDE_CANCEL",
                    title: "Trip Cancelled",
                    message: `The trip "${ride.title}" has been cancelled.`,
                    relatedId: ride.groupId, // Link back to group since ride is gone
                })),
            });
        }

        await prisma.$transaction([
            // Clear notifications for this ride
            prisma.notification.deleteMany({
                where: { relatedId: rideId }
            }),
            // Delete the ride (cascades will handle RSVPs and messages)
            prisma.ride.delete({
                where: { id: rideId },
            }),
        ]);

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("RIDE_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
