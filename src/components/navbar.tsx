import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import NavbarClient from "./navbar-client";

export default async function Navbar() {
    const user = await getCurrentUser();

    if (!user) return null;

    const unreadNotificationsCount = await prisma.notification.count({
        where: { userId: user.id, isRead: false }
    });

    return (
        <NavbarClient
            user={{ name: user.name, image: user.image }}
            unreadCount={unreadNotificationsCount}
        />
    );
}
