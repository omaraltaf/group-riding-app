"use client";

import { signOut } from "next-auth/react";
import { User, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface UserMenuProps {
    user: {
        name?: string | null;
        image?: string | null;
    };
}

export default function UserMenu({ user }: UserMenuProps) {
    const [isOpen, setIsOpen] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="flex items-center gap-3 bg-zinc-900 rounded-full pl-3 pr-1 py-1 ring-1 ring-zinc-800 hover:ring-zinc-700 transition-all active:scale-95 shadow-lg shadow-black/50 overflow-hidden group"
            >
                <span className="text-xs font-black text-zinc-400 uppercase tracking-widest group-hover:text-white transition-colors">
                    {user.name}
                </span>
                <div className="h-8 w-8 rounded-full bg-zinc-800 flex items-center justify-center overflow-hidden border border-zinc-700 group-hover:border-zinc-500 transition-colors">
                    {user.image ? (
                        <img src={user.image} alt={user.name || ""} className="h-full w-full object-cover" />
                    ) : (
                        <User className="h-4 w-4 text-zinc-400" />
                    )}
                </div>
            </button>

            {isOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl py-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <button
                        onClick={() => signOut({ callbackUrl: "/login" })}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm font-bold text-red-500 hover:bg-red-500/10 transition-colors"
                    >
                        <LogOut className="h-4 w-4" />
                        Logout
                    </button>
                </div>
            )}
        </div>
    );
}
