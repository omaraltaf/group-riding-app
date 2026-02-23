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
        });

        if (!ride) return new NextResponse("Ride not found", { status: 404 });

        const body = await req.json();
        const { status } = body; // CONFIRMED, DECLINED, MAYBE, PENDING

        if (!["CONFIRMED", "DECLINED", "MAYBE", "PENDING"].includes(status)) {
            return new NextResponse("Invalid status", { status: 400 });
        }

        // Check if there's a rider cap
        if (status === "CONFIRMED" && ride.riderCap) {
            const confirmedCount = await prisma.rSVP.count({
                where: { rideId: ride.id, status: "CONFIRMED" },
            });

            if (confirmedCount >= ride.riderCap) {
                return new NextResponse("Ride is full", { status: 400 });
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

        return NextResponse.json(rsvp);
    } catch (error) {
        console.error("RSVP_POST_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
