"use client";

import { useState, useEffect } from "react";
import { Users, Search, ChevronRight, Shield, Clock, Trophy, Car, MapPin, Bike, Compass } from "lucide-react";
import Link from "next/link";

interface Group {
    id: string;
    name: string;
    description: string;
    category: string;
    myStatus: string | null;
    myRole: string | null;
    _count: {
        memberships: number;
        trips: number;
    };
}

const CATEGORIES = [
    { id: "ALL", label: "All Groups", icon: Users },
    { id: "BIKES", label: "Bike Groups", icon: Trophy },
    { id: "CARS_4X4", label: "Cars/4x4", icon: Car },
    { id: "CYCLING", label: "Cycling", icon: Bike },
    { id: "EXCURSIONS", label: "Excursions", icon: Compass },
];

export default function ExploreGroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState("ALL");
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchGroups = async () => {
            try {
                const params = new URLSearchParams();
                if (searchQuery) params.append("q", searchQuery);
                if (activeCategory !== "ALL") params.append("category", activeCategory);

                const res = await fetch(`/api/groups/discovery?${params.toString()}`);
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch groups");
                const data = await res.json();
                setGroups(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        const timer = setTimeout(fetchGroups, 300);
        return () => clearTimeout(timer);
    }, [searchQuery, activeCategory]);

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">Explore Groups</h1>
                        <p className="text-zinc-400">Discover and join vehicle and travel communities.</p>
                    </div>
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
                        <Users className="h-6 w-6 text-zinc-400" />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mb-10">
                    {CATEGORIES.map((cat) => (
                        <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className={`flex items-center gap-2 px-6 py-3 rounded-2xl text-xs font-black uppercase tracking-widest transition-all ${activeCategory === cat.id
                                ? "bg-orange-500 text-white shadow-lg shadow-orange-500/20"
                                : "bg-zinc-900 text-zinc-400 hover:bg-zinc-800 ring-1 ring-zinc-800"
                                }`}
                        >
                            <cat.icon className="h-4 w-4" />
                            {cat.label}
                        </button>
                    ))}
                </div>

                <div className="mb-10 relative">
                    <div className="relative mb-12">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Find groups by name or description..."
                            className="w-full bg-zinc-900 border-0 rounded-2xl py-4 pl-12 pr-4 text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl"
                        />
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20">
                            <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
                        </div>
                    ) : groups.length === 0 ? (
                        <div className="text-center py-20 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                            <div className="h-20 w-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-zinc-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">No groups found</h2>
                            <p className="text-zinc-500">Try adjusting your search criteria.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {groups.map((group) => (
                                <Link
                                    key={group.id}
                                    href={`/groups/${group.id}`}
                                    className="group p-6 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800 hover:ring-orange-500/50 transition-all shadow-lg hover:shadow-orange-500/5"
                                >
                                    <div className="flex justify-between items-start mb-6">
                                        <div>
                                            <h3 className="text-xl font-bold group-hover:text-orange-500 transition-colors">{group.name}</h3>
                                            <p className="text-zinc-500 text-sm mt-1 line-clamp-1">{group.description || "No description provided."}</p>
                                        </div>
                                        <div className="h-12 w-12 bg-zinc-800 rounded-2xl flex items-center justify-center">
                                            <Users className="h-6 w-6 text-zinc-400 group-hover:text-orange-500 transition-colors" />
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-6">
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>{group._count.memberships} Members</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <Clock className="h-4 w-4" />
                                            <span>{group._count.trips} Trips</span>
                                        </div>
                                        {group.myStatus && (
                                            <div className="flex items-center gap-2 text-emerald-500 text-sm font-bold">
                                                <Shield className="h-4 w-4" />
                                                <span>{group.myStatus === "APPROVED" ? (group.myRole === "ADMIN" ? "Admin" : "Joined") : "Pending"}</span>
                                            </div>
                                        )}
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-end">
                                        <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-500 flex items-center gap-1 transition-colors">
                                            {group.myStatus === "APPROVED" ? "View Group" : "Learn More"} <ChevronRight className="h-4 w-4" />
                                        </span>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </main>
    );
}
