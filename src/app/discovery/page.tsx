"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Search,
    MapPin,
    Clock,
    Plus,
    Filter,
    ChevronRight,
    Bike,
    Users
} from "lucide-react";
import Link from "next/link";

interface Ride {
    id: string;
    title: string;
    description: string;
    startTime: string;
    meetingPoint: string;
    terrainDifficulty: string;
    suitableBikes: string;
    group: { name: string };
    _count: { rsvps: number };
}

export default function DiscoveryPage() {
    const [rides, setRides] = useState<Ride[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [search, setSearch] = useState("");
    const [debouncedSearch, setDebouncedSearch] = useState("");
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);

    // Debounce search
    useEffect(() => {
        const timer = setTimeout(() => {
            setDebouncedSearch(search);
        }, 500);
        return () => clearTimeout(timer);
    }, [search]);

    const fetchRides = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams({
                search: debouncedSearch,
                limit: "12",
            });
            if (isLoadMore && nextCursor) {
                params.append("cursor", nextCursor);
            }

            const res = await fetch(`/api/rides/discovery?${params.toString()}`);
            const data = await res.json();

            if (isLoadMore) {
                setRides(prev => [...prev, ...data.rides]);
            } else {
                setRides(data.rides);
            }
            setNextCursor(data.nextCursor);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [debouncedSearch, nextCursor]);

    useEffect(() => {
        fetchRides();
    }, [debouncedSearch]);

    if (loading && rides.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md px-6 py-6 sticky top-0 z-50">
                <div className="mx-auto max-w-7xl flex flex-col md:flex-row md:items-center justify-between gap-6">
                    <div>
                        <h1 className="text-3xl font-black italic tracking-tighter text-white">DISCOVER RIDES</h1>
                        <p className="text-zinc-500 text-sm mt-1 uppercase font-bold tracking-widest">Explore the open road</p>
                    </div>
                    <div className="flex items-center gap-4 flex-1 max-w-2xl">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search rides, routes, or locations..."
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                className="w-full bg-zinc-900 border-0 rounded-2xl py-4 pl-12 pr-4 text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl"
                            />
                        </div>
                        <button className="h-14 w-14 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800 hover:bg-zinc-800 transition-all">
                            <Filter className="h-6 w-6 text-zinc-400" />
                        </button>
                    </div>
                </div>
            </nav>

            <div className="mx-auto max-w-7xl px-6 py-12">
                {rides.length === 0 ? (
                    <div className="text-center py-32 bg-zinc-900 rounded-[3rem] ring-1 ring-zinc-800">
                        <MapPin className="h-16 w-16 text-zinc-800 mx-auto mb-6" />
                        <h2 className="text-2xl font-bold mb-2">No rides found</h2>
                        <p className="text-zinc-500">Try adjusting your search or check back later for new rides.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-8">
                            {rides.map(ride => (
                                <Link
                                    key={ride.id}
                                    href={`/rides/${ride.id}`}
                                    className="group relative bg-zinc-900 rounded-[2.5rem] overflow-hidden ring-1 ring-zinc-800 hover:ring-orange-500/50 transition-all shadow-2xl hover:-translate-y-1"
                                >
                                    <div className="h-48 bg-zinc-800 relative">
                                        <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 to-transparent"></div>
                                        <div className="absolute top-6 left-6 flex gap-2">
                                            <span className="px-3 py-1 bg-zinc-950/80 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-tighter ring-1 ring-white/10">
                                                {new Date(ride.startTime).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                                            </span>
                                            <span className={`px-3 py-1 backdrop-blur-md rounded-lg text-[10px] font-black uppercase tracking-tighter ring-1 ${ride.terrainDifficulty === "Expert" ? "bg-red-500/20 text-red-500 ring-red-500/30" :
                                                ride.terrainDifficulty === "Challenging" ? "bg-orange-500/20 text-orange-500 ring-orange-500/30" :
                                                    "bg-emerald-500/20 text-emerald-500 ring-emerald-500/30"
                                                }`}>
                                                {ride.terrainDifficulty}
                                            </span>
                                        </div>
                                        <div className="absolute bottom-6 left-6">
                                            <p className="text-orange-500 text-xs font-black uppercase tracking-widest mb-1">{ride.group.name}</p>
                                            <h3 className="text-2xl font-black text-white group-hover:text-orange-500 transition-colors line-clamp-1">{ride.title}</h3>
                                        </div>
                                    </div>

                                    <div className="p-8 space-y-6">
                                        <p className="text-zinc-400 text-sm line-clamp-2 min-h-[40px] leading-relaxed">
                                            {ride.description || "No description provided for this ride."}
                                        </p>

                                        <div className="grid grid-cols-2 gap-4 pt-4 border-t border-zinc-800">
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <MapPin className="h-4 w-4 text-zinc-600" />
                                                <span className="truncate">{ride.meetingPoint}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <Clock className="h-4 w-4 text-zinc-600" />
                                                <span>{new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <Bike className="h-4 w-4 text-zinc-600" />
                                                <span className="truncate">{ride.suitableBikes || "Any Bike"}</span>
                                            </div>
                                            <div className="flex items-center gap-2 text-zinc-500 text-xs">
                                                <Users className="h-4 w-4 text-zinc-600" />
                                                <span>{ride._count.rsvps} Attending</span>
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-4">
                                            <div className="flex -space-x-2">
                                                {[1, 2, 3].map(i => (
                                                    <div key={i} className="h-8 w-8 rounded-full bg-zinc-800 ring-2 ring-zinc-900 flex items-center justify-center">
                                                        <Users className="h-4 w-4 text-zinc-700" />
                                                    </div>
                                                ))}
                                                {ride._count.rsvps > 3 && (
                                                    <div className="h-8 w-8 rounded-full bg-orange-600 ring-2 ring-zinc-900 flex items-center justify-center text-[10px] font-bold">
                                                        +{ride._count.rsvps - 3}
                                                    </div>
                                                )}
                                            </div>
                                            <span className="text-xs font-black uppercase tracking-widest text-orange-500 flex items-center gap-2 group-hover:gap-3 transition-all">
                                                View Details <ChevronRight className="h-4 w-4" />
                                            </span>
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>

                        {nextCursor && (
                            <div className="mt-16 flex justify-center">
                                <button
                                    onClick={() => fetchRides(true)}
                                    disabled={loadingMore}
                                    className="px-10 py-5 bg-zinc-900 rounded-[2rem] text-sm font-black uppercase tracking-widest ring-1 ring-zinc-800 hover:bg-zinc-800 hover:ring-orange-500 transition-all disabled:opacity-50"
                                >
                                    {loadingMore ? "Loading..." : "Load More Rides"}
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            <Link
                href="/groups/create"
                className="fixed bottom-8 right-8 h-16 w-16 bg-orange-600 rounded-full flex items-center justify-center shadow-2xl shadow-orange-900/40 hover:scale-110 active:scale-95 transition-all z-50 group"
            >
                <Plus className="h-8 w-8 text-white group-hover:rotate-90 transition-all duration-300" />
            </Link>
        </main>
    );
}
