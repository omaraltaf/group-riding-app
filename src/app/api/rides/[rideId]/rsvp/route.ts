import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ rideId: string }> }
) {
    const { rideId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const ride = await prisma.ride.findUnique({
            where: { id: rideId },
            select: {
                id: true,
                title: true,
                creatorId: true,
                participantCap: true,
                _count: {
                    select: { rsvps: { where: { status: "CONFIRMED" } } }
                }
            }
        });

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

        const body = await req.json();
        const { status } = body; // CONFIRMED, DECLINED, MAYBE, PENDING

        if (!["CONFIRMED", "DECLINED", "MAYBE", "PENDING"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        // Check if there's a participant cap
        if (status === "CONFIRMED" && (ride as any).participantCap) {
            const confirmedCount = (ride as any)._count.rsvps;
            if (confirmedCount >= (ride as any).participantCap) {
                return new NextResponse("Trip is already full", { status: 400 });
            }
        }

        const rsvp = await prisma.rSVP.upsert({
            where: {
                userId_rideId: {
                    userId: user.id,
                    rideId: rideId,
                },
            },
            update: { status },
            create: {
                userId: user.id,
                rideId: rideId,
                status,
            },
        });

        // NOTIFICATION: Notify the ride creator if it's confirmed or interested
        if ((status === "CONFIRMED" || status === "INTERESTED") && ride.creatorId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: ride.creatorId,
                    type: "RIDE_UPDATE",
                    title: "New RSVP!",
                    message: `${user.name} is ${status.toLowerCase()} for your ride "${ride.title}".`,
                    relatedId: rideId,
                },
            });
        }

        return NextResponse.json(rsvp);
    } catch (error) {
        console.error("RSVP_POST_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
