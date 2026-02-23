"use client";

import { useState, useEffect } from "react";
import { Users, Plus, ChevronRight, Search, Shield, Clock } from "lucide-react";
import Link from "next/link";

interface Group {
    id: string;
    name: string;
    description: string;
    _count: {
        memberships: number;
        rides: number;
    };
}

export default function GroupsPage() {
    const [groups, setGroups] = useState<Group[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/groups")
            .then(res => res.json())
            .then(data => {
                setGroups(data);
                setLoading(false);
            })
            .catch(err => console.error(err));
    }, []);

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">
                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">My Groups</h1>
                        <p className="text-zinc-400">Manage your groups and connect with riders.</p>
                    </div>
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
                        <Users className="h-6 w-6 text-zinc-400" />
                    </div>
                </div>
                <div className="mb-10 relative">
                    <div className="flex flex-col md:flex-row gap-4 w-full mb-12">
                        <div className="relative flex-1">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                            <input
                                type="text"
                                placeholder="Search your groups..."
                                className="w-full bg-zinc-900 border-0 rounded-2xl py-4 pl-12 pr-4 text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all shadow-xl"
                            />
                        </div>
                        <Link
                            href="/groups/create"
                            className="flex items-center justify-center gap-2 rounded-2xl bg-orange-600 px-6 py-4 font-bold hover:bg-orange-500 transition-all active:scale-95 shadow-xl shadow-orange-950/20"
                        >
                            <Plus className="h-5 w-5" /> Create Group
                        </Link>
                    </div>

                    {groups.length === 0 ? (
                        <div className="text-center py-20 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                            <div className="h-20 w-20 bg-zinc-800 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Users className="h-10 w-10 text-zinc-600" />
                            </div>
                            <h2 className="text-2xl font-bold mb-2">No groups yet</h2>
                            <p className="text-zinc-500 mb-8 max-w-sm mx-auto">Create a group to start organizing rides and connecting with other riders.</p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <Link
                                    href="/groups/create"
                                    className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-6 py-3 font-semibold hover:bg-orange-500 transition-all shadow-lg active:scale-95"
                                >
                                    <Plus className="h-5 w-5" /> Start First Group
                                </Link>
                                <Link
                                    href="/groups/explore"
                                    className="inline-flex items-center gap-2 rounded-xl bg-zinc-800 px-6 py-3 font-semibold hover:bg-zinc-700 transition-all ring-1 ring-zinc-700"
                                >
                                    <Search className="h-5 w-5 text-orange-500" /> Explore Groups
                                </Link>
                            </div>
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
                                            <Shield className="h-4 w-4 text-orange-500" />
                                            <span>Member</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <Users className="h-4 w-4" />
                                            <span>{group._count.memberships} Members</span>
                                        </div>
                                        <div className="flex items-center gap-2 text-zinc-400 text-sm">
                                            <Clock className="h-4 w-4" />
                                            <span>{group._count.rides} Rides</span>
                                        </div>
                                    </div>

                                    <div className="mt-6 pt-6 border-t border-zinc-800 flex justify-end">
                                        <span className="text-sm font-bold text-zinc-500 group-hover:text-orange-500 flex items-center gap-1 transition-colors">
                                            Manage Group <ChevronRight className="h-4 w-4" />
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
