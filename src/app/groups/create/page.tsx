"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Save, Globe, Lock } from "lucide-react";
import Link from "next/link";

export default function CreateGroupPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [formData, setFormData] = useState({
        name: "",
        description: "",
        joinPolicy: "REQUEST_ONLY", // OPEN, REQUEST_ONLY
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch("/api/groups", {
                method: "POST",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                const group = await res.json();
                router.push(`/groups/${group.id}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
                <div className="mx-auto max-w-3xl flex items-center justify-between">
                    <Link href="/groups" className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Back to Groups</span>
                    </Link>
                    <h1 className="text-xl font-bold">New Group</h1>
                    <div className="w-20"></div>
                </div>
            </nav>

            <div className="mx-auto max-w-3xl px-6 pt-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <div className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Group Name</label>
                                <input
                                    required
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all text-lg"
                                    placeholder="e.g. Desert Explorers"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Description</label>
                                <textarea
                                    rows={4}
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="What is this group about? Who should join?"
                                />
                            </div>

                            <div className="pt-6 space-y-4">
                                <label className="text-sm font-medium text-zinc-400">Joining Policy</label>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, joinPolicy: "OPEN" })}
                                        className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${formData.joinPolicy === "OPEN"
                                            ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20"
                                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                            }`}
                                    >
                                        <Globe className={`h-6 w-6 ${formData.joinPolicy === "OPEN" ? "text-orange-500" : "text-zinc-500"}`} />
                                        <div>
                                            <span className="block font-bold">Open</span>
                                            <span className="text-xs text-zinc-500">Anyone can join instantly.</span>
                                        </div>
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setFormData({ ...formData, joinPolicy: "REQUEST_ONLY" })}
                                        className={`p-4 rounded-2xl border-2 flex flex-col gap-2 transition-all text-left ${formData.joinPolicy === "REQUEST_ONLY"
                                            ? "border-orange-500 bg-orange-500/5 ring-1 ring-orange-500/20"
                                            : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                            }`}
                                    >
                                        <Lock className={`h-6 w-6 ${formData.joinPolicy === "REQUEST_ONLY" ? "text-orange-500" : "text-zinc-500"}`} />
                                        <div>
                                            <span className="block font-bold">Request Only</span>
                                            <span className="text-xs text-zinc-500">Admins must approve members.</span>
                                        </div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="flex justify-end gap-4">
                        <Link
                            href="/groups"
                            className="rounded-xl bg-zinc-900 px-8 py-4 font-semibold text-zinc-400 hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-orange-600 px-10 py-4 font-semibold text-white shadow-xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" /> {loading ? "Creating..." : "Create Group"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
