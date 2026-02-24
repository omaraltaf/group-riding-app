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
                            select: { id: true, name: true, image: true, bikeTypes: true, ridingExperience: true }
                        }
                    }
                },
                _count: {
                    select: { rsvps: true }
                }
            }
        });

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

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

        const myRsvp = ride.rsvps.find((r: any) => r.userId === user.id);

        return NextResponse.json({
            ...ride,
            isMember: !!membership,
            isAdmin: isPlatformAdmin || membership?.role === "ADMIN",
            isCreator: ride.creatorId === user.id,
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

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

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
            meetingPoint,
            itinerary,
            terrainDifficulty,
            suitableBikes,
            riderCap,
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

        const parsedRiderCap = riderCap ? parseInt(riderCap) : null;
        if (riderCap && isNaN(parsedRiderCap as number)) {
            return new NextResponse("Invalid rider capacity", { status: 400 });
        }

        const updatedRide = await prisma.ride.update({
            where: { id: rideId },
            data: {
                title: title === "" ? undefined : title,
                description: description === "" ? undefined : description,
                startTime: rideStartTime || undefined,
                meetingPoint: meetingPoint === "" ? undefined : meetingPoint,
                itinerary,
                terrainDifficulty,
                suitableBikes,
                riderCap: (riderCap && !isNaN(parsedRiderCap as number)) ? parsedRiderCap : undefined,
                isPublic: isPublic !== undefined ? !!isPublic : undefined,
                status: status || undefined,
                destination: destination === "" ? undefined : destination,
                destinationUrl,
                meetingPointUrl,
            },
        });

        // NOTIFICATION: Notify all RSVP'd riders about the update
        const participants = await prisma.rSVP.findMany({
            where: {
                rideId: rideId,
                status: { in: ["CONFIRMED", "INTERESTED"] },
                userId: { not: user.id }, // Don't notify the person making the update
            },
            select: { userId: true },
        });

        if (participants.length > 0) {
            await prisma.notification.createMany({
                data: participants.map((p) => ({
                    userId: p.userId,
                    type: "RIDE_UPDATE",
                    title: "Ride Updated",
                    message: `Important: Details for the ride "${updatedRide.title}" have been updated.`,
                    relatedId: rideId,
                })),
            });
        }

        return NextResponse.json(updatedRide);
    } catch (error) {
        console.error("RIDE_PATCH_ERROR", error);
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
            include: {
                rsvps: {
                    where: { status: { in: ["CONFIRMED", "INTERESTED"] } },
                    select: { userId: true }
                }
            }
        });

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

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

            if (!membership || membership.role !== "ADMIN") {
                return new NextResponse("Forbidden", { status: 403 });
            }
        }

        // NOTIFICATION: Notify all RSVP'd riders about the cancellation BEFORE deleting
        if (ride.rsvps.length > 0) {
            const participantsToNotify = ride.rsvps.filter(r => r.userId !== user.id);
            if (participantsToNotify.length > 0) {
                await prisma.notification.createMany({
                    data: participantsToNotify.map((p) => ({
                        userId: p.userId,
                        type: "RIDE_CANCEL",
                        title: "Ride Cancelled",
                        message: `The ride "${ride.title}" has been cancelled.`,
                        relatedId: ride.groupId, // Link back to group since ride is gone
                    })),
                });
            }
        }

        await prisma.ride.delete({
            where: { id: rideId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("RIDE_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
