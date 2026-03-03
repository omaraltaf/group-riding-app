import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export const runtime = "nodejs";

export async function POST(
    req: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    try {
        const user = await getCurrentUser();
        if (!user) return new NextResponse("Unauthorized", { status: 401 });

        const trip = await prisma.trip.findUnique({
            where: { id: tripId },
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

        if (!trip) return new NextResponse("Trip not found", { status: 404 });

        const body = await req.json();
        const { status } = body; // CONFIRMED, DECLINED, MAYBE, PENDING

        if (!["CONFIRMED", "DECLINED", "MAYBE", "PENDING"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        // Check if there's a participant cap
        if (status === "CONFIRMED" && (trip as any).participantCap) {
            const confirmedCount = (trip as any)._count.rsvps;
            if (confirmedCount >= (trip as any).participantCap) {
                return new NextResponse("Trip is already full", { status: 400 });
            }
        }

        const rsvp = await prisma.rSVP.upsert({
            where: {
                userId_tripId: {
                    userId: user.id,
                    tripId: tripId,
                },
            },
            update: { status },
            create: {
                userId: user.id,
                tripId,
                status,
            },
        });

        // NOTIFICATION: Notify the trip creator if it's confirmed or interested
        if ((status === "CONFIRMED" || status === "INTERESTED") && trip.creatorId !== user.id) {
            await prisma.notification.create({
                data: {
                    userId: trip.creatorId,
                    type: "RIDE_UPDATE",
                    title: "New RSVP!",
                    message: `${user.name} is ${status.toLowerCase()} for your trip "${trip.title}".`,
                    relatedId: tripId,
                },
            });
        }

        return NextResponse.json(rsvp);
    } catch (error) {
        console.error("RSVP_POST_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
