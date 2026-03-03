import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NavbarClient from "./navbar-client";

export default async function Navbar() {
    const user = await getCurrentUser();

    if (!user) return null;

    let unreadNotificationsCount = 0;
    try {
        unreadNotificationsCount = await prisma.notification.count({
            where: { userId: user.id, isRead: false }
        });
    } catch (error) {
        console.error("[Navbar] Fetch error:", error);
    }

    return (
        <NavbarClient
            user={{
                name: user.name ?? null,
                image: user.image ?? null
            }}
            unreadCount={unreadNotificationsCount}
        />
    );
}
