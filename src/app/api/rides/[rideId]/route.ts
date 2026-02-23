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

        if (!membership && !ride.isPublic) {
            return new NextResponse("Forbidden", { status: 403 });
        }

        const myRsvp = ride.rsvps.find(r => r.userId === user.id);

        return NextResponse.json({
            ...ride,
            isMember: !!membership,
            isAdmin: membership?.role === "ADMIN",
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

        const updatedRide = await prisma.ride.update({
            where: { id: rideId },
            data: {
                title,
                description,
                startTime: startTime ? new Date(startTime) : undefined,
                meetingPoint,
                itinerary,
                terrainDifficulty,
                suitableBikes,
                riderCap: riderCap ? parseInt(riderCap) : undefined,
                isPublic: isPublic !== undefined ? !!isPublic : undefined,
                status: status || undefined,
                destination,
                destinationUrl,
                meetingPointUrl,
            },
        });

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
        });

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

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

        await prisma.ride.delete({
            where: { id: rideId },
        });

        return new NextResponse(null, { status: 204 });
    } catch (error) {
        console.error("RIDE_DELETE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
