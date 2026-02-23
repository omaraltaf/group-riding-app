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
        const { content } = body;

        if (!content) return new NextResponse("Content is required", { status: 400 });

        const message = await prisma.message.create({
            data: {
                content,
                userId: user.id,
                rideId: rideId,
            },
            include: {
                user: {
                    select: { id: true, name: true, image: true }
                }
            }
        });

        return NextResponse.json(message);
    } catch (error) {
        console.error("MESSAGE_CREATE_ERROR", error);
        return new NextResponse("Internal server error", { status: 500 });
    }
}

export async function GET(
    req: Request,
    { params }: { params: Promise<{ rideId: string }> }
) {
    const { rideId } = await params;
    try {
        const messages = await prisma.message.findMany({
            where: { rideId: rideId },
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
