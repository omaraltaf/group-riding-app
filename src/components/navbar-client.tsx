"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Plus, Menu, X } from "lucide-react";
import UserMenu from "./user-menu";

interface NavbarClientProps {
    user: {
        name: string | null;
        image: string | null;
    };
    unreadCount: number;
}

export default function NavbarClient({ user, unreadCount }: NavbarClientProps) {
    const [isMenuOpen, setIsMenuOpen] = useState(false);

    const navLinks = [
        { href: "/groups", label: "My Groups" },
        { href: "/groups/explore", label: "Explore Groups" },
        { href: "/rides", label: "Discover Rides" },
    ];

    return (
        <nav className="sticky top-0 z-50 border-b border-zinc-800 bg-zinc-950/80 backdrop-blur-md px-6 py-4">
            <div className="mx-auto max-w-7xl">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <Link href="/" className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center hover:bg-orange-500 transition-all active:scale-95 shadow-lg shadow-orange-950/20">
                            <Plus className="text-white h-6 w-6" />
                        </Link>
                        <span className="text-xl font-bold tracking-tight text-white">TripKarLo</span>
                    </div>

                    <div className="flex items-center gap-4">
                        <div className="hidden md:flex items-center gap-6 mr-6 text-zinc-400 text-sm font-black uppercase tracking-widest">
                            {navLinks.map((link) => (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    className="hover:text-white transition-colors"
                                >
                                    {link.label}
                                </Link>
                            ))}
                        </div>

                        <Link href="/notifications" className="relative h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95 group">
                            <Bell className="h-5 w-5 text-zinc-400 group-hover:text-white transition-colors" />
                            {unreadCount > 0 && (
                                <span className="absolute top-0 right-0 h-4 w-4 bg-orange-600 rounded-full flex items-center justify-center text-[10px] font-black border-2 border-zinc-950 text-white">
                                    {unreadCount}
                                </span>
                            )}
                        </Link>

                        <div className="hidden md:block">
                            <UserMenu user={user} />
                        </div>

                        <button
                            onClick={() => setIsMenuOpen(!isMenuOpen)}
                            className="md:hidden h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 hover:text-white transition-all active:scale-95"
                        >
                            {isMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
                        </button>
                    </div>
                </div>

                {/* Mobile Menu */}
                {isMenuOpen && (
                    <div className="md:hidden py-6 space-y-4 border-t border-zinc-800 mt-4 animate-in slide-in-from-top duration-200">
                        {navLinks.map((link) => (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={() => setIsMenuOpen(false)}
                                className="block text-zinc-400 hover:text-white text-lg font-black uppercase tracking-widest transition-colors"
                            >
                                {link.label}
                            </Link>
                        ))}
                        <div className="pt-4 border-t border-zinc-800 flex items-center justify-between">
                            <span className="text-sm font-bold text-zinc-500">Account</span>
                            <UserMenu user={user} />
                        </div>
                    </div>
                )}
            </div>
        </nav>
    );
}
