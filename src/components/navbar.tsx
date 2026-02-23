import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Bell, Plus } from "lucide-react";
import UserMenu from "./user-menu";

export default async function Navbar() {
    const user = await getCurrentUser();

    if (!user) return null;

    const unreadNotificationsCount = await prisma.notification.count({
        where: { userId: user.id, isRead: false }
    });

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
            <div className="mx-auto max-w-7xl flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <Link href="/" className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-950/20">
                        <Plus className="text-white h-6 w-6" />
                    </Link>
                    <span className="text-xl font-bold tracking-tight text-white">TripKarLo</span>
                </div>
                <div className="flex items-center gap-4">
                    <div className="hidden md:flex items-center gap-6 mr-6 text-zinc-400 text-sm font-black uppercase tracking-widest">
                        <Link href="/groups" className="hover:text-white transition-colors">My Groups</Link>
                        <Link href="/groups/explore" className="hover:text-white transition-colors">Explore Groups</Link>
                        <Link href="/rides" className="hover:text-white transition-colors">Discover Rides</Link>
                    </div>

                    <Link href="/notifications" className="relative h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 group">
                        <Bell className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                        {unreadNotificationsCount > 0 && (
                            <span className="absolute top-0 right-0 h-4 w-4 bg-orange-600 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-zinc-950 text-white">
                                {unreadNotificationsCount}
                            </span>
                        )}
                    </Link>

                    <UserMenu user={{ name: user.name, image: user.image }} />
                </div>
            </div>
        </nav>
    );
}
