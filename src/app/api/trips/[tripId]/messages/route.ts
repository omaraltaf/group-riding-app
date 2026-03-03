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
        });

        if (!trip) return new NextResponse("Trip not found", { status: 404 });

        const body = await req.json();
        const { content } = body;

        if (!content) return new NextResponse("Content is required", { status: 400 });

        const message = await prisma.message.create({
            data: {
                content,
                userId: user.id,
                tripId: tripId,
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                },
                trip: true,
            }
        });

        // NOTIFICATION: Notify all other RSVP'd participants about the new message
        const participants = await prisma.rSVP.findMany({
            where: {
                tripId: tripId,
                status: { in: ["CONFIRMED", "INTERESTED"] },
                userId: { not: user.id }, // Don't notify the sender
            },
            select: { userId: true },
        });

        if (participants.length > 0) {
            await prisma.notification.createMany({
                data: participants.map((p) => ({
                    userId: p.userId,
                    type: "MESSAGE",
                    title: `New Message in ${(message as any).trip.title}`,
                    message: `${user.name}: ${content.substring(0, 50)}${content.length > 50 ? "..." : ""}`,
                    relatedId: tripId,
                })),
            });
        }

        return NextResponse.json(message);
    } catch (error) {
        console.error("MESSAGE_CREATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ tripId: string }> }
) {
    const { tripId } = await params;
    try {
        const messages = await prisma.message.findMany({
            where: { tripId: tripId },
            orderBy: { createdAt: "asc" },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json(messages);
    } catch (error) {
        console.error("MESSAGES_GET_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}
