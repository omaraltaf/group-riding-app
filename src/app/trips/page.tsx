"use client";

import { useState, useEffect, useCallback } from "react";
import {
    Calendar,
    MapPin,
    Users as UsersIcon,
    Search,
    Car,
    Trophy,
    ChevronRight
} from "lucide-react";
import Link from "next/link";

interface Trip {
    id: string;
    title: string;
    description: string;
    startTime: string;
    meetingPoint: string;
    terrainDifficulty: string;
    suitableVehicles: string;
    category: string;
    group: {
        name: string;
    };
    _count: {
        rsvps: number;
    };
}

const CATEGORIES = [
    { id: "ALL", label: "All Adventures", icon: Car },
    { id: "BIKES", label: "Bike Trips", icon: Trophy },
    { id: "CARS_4X4", label: "Cars/4x4", icon: Car },
    { id: "CYCLING", label: "Cycling", icon: ChevronRight },
    { id: "EXCURSIONS", label: "Excursions", icon: MapPin },
];

export default function DiscoverTripsPage() {
    const [trips, setTrips] = useState<Trip[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [locationFilter, setLocationFilter] = useState("");
    const [fromDate, setFromDate] = useState("");
    const [toDate, setToDate] = useState("");
    const [nextCursor, setNextCursor] = useState<string | undefined>(undefined);
    const [activeCategory, setActiveCategory] = useState("ALL");

    const fetchTrips = useCallback(async (isLoadMore = false) => {
        if (!isLoadMore) setLoading(true);
        else setLoadingMore(true);

        try {
            const params = new URLSearchParams({
                search: searchTerm,
                location: locationFilter,
                fromDate,
                toDate,
                limit: "10",
                category: activeCategory,
            });
            if (isLoadMore && nextCursor) {
                params.append("cursor", nextCursor);
            }

            const res = await fetch(`/api/trips/discovery?${params.toString()}`);
            if (res.status === 401) {
                window.location.href = "/login";
                return;
            }
            if (!res.ok) throw new Error("Failed to fetch trips");

            const data = await res.json();
            const newTrips = Array.isArray(data.trips) ? data.trips : [];

            if (isLoadMore) {
                setTrips(prev => [...prev, ...newTrips]);
            } else {
                setTrips(newTrips);
            }
            setNextCursor(data.nextCursor);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [searchTerm, locationFilter, fromDate, toDate, nextCursor, activeCategory]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchTrips();
        }, 400);
        return () => clearTimeout(timer);
    }, [searchTerm, locationFilter, fromDate, toDate, activeCategory]);

    const clearFilters = () => {
        setSearchTerm("");
        setLocationFilter("");
        setFromDate("");
        setToDate("");
        setActiveCategory("ALL");
    };

    if (loading && trips.length === 0) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">Discover Trips</h1>
                        <p className="text-zinc-400">Find your next group adventure (Bikes/Cars/SUVs/4x4s) on the open road.</p>
                    </div>
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
                        <Car className="h-6 w-6 text-zinc-400" />
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

                <div className="flex flex-col md:flex-row gap-4 w-full mb-12">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Search trips or groups..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full bg-zinc-900 border-0 rounded-2xl pl-10 pr-4 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl shadow-black/50"
                        />
                    </div>
                    <div className="relative w-full md:w-48">
                        <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-500" />
                        <input
                            type="text"
                            placeholder="Location..."
                            value={locationFilter}
                            onChange={(e) => setLocationFilter(e.target.value)}
                            className="w-full bg-zinc-900 border-0 rounded-2xl pl-10 pr-4 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl shadow-black/50"
                        />
                    </div>
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={fromDate}
                            onChange={(e) => setFromDate(e.target.value)}
                            className="bg-zinc-900 border-0 rounded-2xl px-4 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl shadow-black/50 appearance-none"
                        />
                        <span className="text-zinc-500 text-xs font-bold uppercase">to</span>
                        <input
                            type="date"
                            value={toDate}
                            onChange={(e) => setToDate(e.target.value)}
                            className="bg-zinc-900 border-0 rounded-2xl px-4 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl shadow-black/50 appearance-none"
                        />
                    </div>
                    {(searchTerm || locationFilter || fromDate || toDate) && (
                        <button
                            onClick={clearFilters}
                            className="px-4 py-3 rounded-2xl bg-zinc-800 hover:bg-zinc-700 text-sm font-bold transition-all whitespace-nowrap"
                        >
                            Clear
                        </button>
                    )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {trips.length === 0 ? (
                        <div className="col-span-full p-20 text-center bg-zinc-900 rounded-[2.5rem] ring-1 ring-zinc-800">
                            <Calendar className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">No trips found</h3>
                            <p className="text-zinc-500">Try adjusting your search or check back later for new adventures.</p>
                        </div>
                    ) : (
                        <>
                            {trips.map(trip => (
                                <Link
                                    key={trip.id}
                                    href={`/trips/${trip.id}`}
                                    className="group relative overflow-hidden rounded-[2rem] bg-zinc-900 p-8 ring-1 ring-zinc-800 hover:ring-orange-500/50 transition-all hover:bg-zinc-900/50 flex flex-col justify-between shadow-2xl shadow-black/50"
                                >
                                    <div>
                                        <div className="flex justify-between items-start mb-6">
                                            <div className="flex gap-2">
                                                <span className={`px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider ring-1 ${trip.terrainDifficulty === "Expert" ? "bg-red-500/10 text-red-500 ring-red-500/20" :
                                                    trip.terrainDifficulty === "Medium" ? "bg-orange-500/10 text-orange-500 ring-orange-500/20" :
                                                        "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                                                    }`}>
                                                    {trip.terrainDifficulty}
                                                </span>
                                                <span className="px-2.5 py-1 rounded-md text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">
                                                    Public
                                                </span>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-black text-orange-500">
                                                    {(() => {
                                                        const date = new Date(trip.startTime);
                                                        const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
                                                        return `${months[date.getMonth()]} ${date.getDate()}`;
                                                    })()}
                                                </p>
                                                <p className="text-[10px] text-zinc-500 font-bold">
                                                    {(() => {
                                                        const date = new Date(trip.startTime);
                                                        const hours = date.getHours().toString().padStart(2, '0');
                                                        const minutes = date.getMinutes().toString().padStart(2, '0');
                                                        return `${hours}:${minutes}`;
                                                    })()}
                                                </p>
                                            </div>
                                        </div>

                                        <h3 className="text-xl font-black group-hover:text-orange-500 transition-colors mb-2">{trip.title}</h3>
                                        <p className="text-sm text-zinc-400 mb-4 font-bold flex items-center gap-1.5 opacity-70">
                                            Organized by <span className="text-zinc-300">{trip.group.name}</span>
                                        </p>
                                        <p className="text-sm text-zinc-500 line-clamp-2 mb-8 leading-relaxed font-medium italic">
                                            "{trip.description}"
                                        </p>
                                    </div>

                                    <div className="flex items-center justify-between pt-6 border-t border-zinc-800/50">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                                                <UsersIcon className="h-4 w-4 text-orange-500" />
                                                {trip._count.rsvps} joined
                                            </div>
                                            <div className="flex items-center gap-1.5 text-xs font-bold text-zinc-400">
                                                <MapPin className="h-4 w-4 text-orange-500" />
                                                {trip.meetingPoint}
                                            </div>
                                        </div>
                                        <div className="h-10 w-10 rounded-xl bg-zinc-800 flex items-center justify-center group-hover:bg-orange-600 transition-all active:scale-95 group-hover:shadow-lg group-hover:shadow-orange-950/20">
                                            <ChevronRight className="h-5 w-5 text-zinc-500 group-hover:text-white" />
                                        </div>
                                    </div>
                                </Link>
                            ))}
                            {nextCursor && (
                                <div className="col-span-full mt-12 flex justify-center">
                                    <button
                                        onClick={() => fetchTrips(true)}
                                        disabled={loadingMore}
                                        className="px-10 py-4 bg-zinc-900 rounded-2xl text-xs font-black uppercase tracking-widest ring-1 ring-zinc-800 hover:ring-orange-500/50 transition-all disabled:opacity-50"
                                    >
                                        {loadingMore ? "Loading..." : "Load More"}
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>
        </main>
    );
}
