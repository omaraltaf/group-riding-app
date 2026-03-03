"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    Settings,
    ChevronLeft,
    Save,
    Trash2,
    AlertTriangle,
    Users,
    Shield,
    Lock
} from "lucide-react";
import Link from "next/link";

export default function GroupSettingsPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [message, setMessage] = useState({ type: "", text: "" });

    const [formData, setFormData] = useState({
        name: "",
        description: "",
        joinPolicy: "OPEN",
    });

    useEffect(() => {
        fetch(`/api/groups/${groupId}`)
            .then(res => {
                if (!res.ok) throw new Error("Failed to fetch group");
                return res.json();
            })
            .then(data => {
                if (!data.isAdmin) {
                    router.push(`/groups/${groupId}`);
                    return;
                }
                setFormData({
                    name: data.name || "",
                    description: data.description || "",
                    joinPolicy: data.joinPolicy || "OPEN",
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                router.push("/groups");
            });
    }, [groupId, router]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "PATCH",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Group settings updated successfully!" });
                setTimeout(() => router.push(`/groups/${groupId}`), 1500);
            } else {
                setMessage({ type: "error", text: "Failed to update group settings" });
            }
        } catch (err) {
            console.error(err);
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("CRITICAL: Are you sure you want to delete this group? This action cannot be undone and will delete all trips and member data associated with it.")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/groups");
            } else {
                alert("Failed to delete group");
                setDeleting(false);
            }
        } catch (err) {
            console.error(err);
            alert("An error occurred while deleting the group");
            setDeleting(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-3xl px-6 pt-12">
                <div className="flex items-center gap-4 mb-12">
                    <Link
                        href={`/groups/${groupId}`}
                        className="h-10 w-10 rounded-full bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-all active:scale-95"
                    >
                        <ChevronLeft className="h-5 w-5 text-zinc-400" />
                    </Link>
                    <div>
                        <h1 className="text-3xl font-black tracking-tight">Group Settings</h1>
                        <p className="text-zinc-500 text-sm">Manage community preferences and visibility.</p>
                    </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-8">
                    {message.text && (
                        <div className={`rounded-xl p-4 text-sm font-medium ring-1 transition-all ${message.type === "success"
                            ? "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                            : "bg-red-500/10 text-red-500 ring-red-500/20"
                            }`}>
                            {message.text}
                        </div>
                    )}

                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Users className="h-5 w-5 text-orange-500" />
                            <h3 className="text-xl font-bold">General Information</h3>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Group Name</label>
                            <input
                                type="text"
                                required
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-6 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all font-medium"
                                placeholder="e.g. Weekend Warriors"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Description</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-6 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all min-h-[120px] font-medium"
                                placeholder="What is this group about?"
                            />
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 space-y-6">
                        <div className="flex items-center gap-3 mb-2">
                            <Shield className="h-5 w-5 text-orange-500" />
                            <h3 className="text-xl font-bold">Privacy & Access</h3>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, joinPolicy: "OPEN" })}
                                className={`p-6 rounded-2xl border-2 transition-all text-left group ${formData.joinPolicy === "OPEN"
                                    ? "border-orange-500 bg-orange-500/5"
                                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                    }`}
                            >
                                <Users className={`h-6 w-6 mb-3 ${formData.joinPolicy === "OPEN" ? "text-orange-500" : "text-zinc-500"}`} />
                                <h4 className="font-bold mb-1">Open Group</h4>
                                <p className="text-sm text-zinc-500">Anyone can join instantly. Great for building large communities.</p>
                            </button>

                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, joinPolicy: "REQUEST_ONLY" })}
                                className={`p-6 rounded-2xl border-2 transition-all text-left group ${formData.joinPolicy === "REQUEST_ONLY"
                                    ? "border-orange-500 bg-orange-500/5"
                                    : "border-zinc-800 bg-zinc-900 hover:border-zinc-700"
                                    }`}
                            >
                                <Lock className={`h-6 w-6 mb-3 ${formData.joinPolicy === "REQUEST_ONLY" ? "text-orange-500" : "text-zinc-500"}`} />
                                <h4 className="font-bold mb-1">Private Group</h4>
                                <p className="text-sm text-zinc-500">Admins must approve join requests. Best for tight-knit crews.</p>
                            </button>
                        </div>
                    </section>

                    <section className="bg-red-500/5 rounded-3xl p-8 ring-1 ring-red-500/10 space-y-4">
                        <div className="flex items-center gap-3 text-red-500">
                            <AlertTriangle className="h-6 w-6" />
                            <h3 className="text-xl font-bold">Danger Zone</h3>
                        </div>
                        <p className="text-zinc-500 text-sm">Once you delete a group, there is no going back. Please be certain.</p>
                        <button
                            type="button"
                            onClick={handleDelete}
                            disabled={deleting}
                            className="flex items-center gap-2 px-6 py-3 rounded-xl bg-red-500 text-white font-bold hover:bg-red-600 transition-all active:scale-95 disabled:opacity-50"
                        >
                            <Trash2 className="h-5 w-5" /> {deleting ? "Deleting..." : "Delete Group"}
                        </button>
                    </section>

                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-2xl bg-orange-600 px-10 py-4 text-lg font-bold text-white shadow-xl shadow-orange-950/20 hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" /> {saving ? "Saving Changes..." : "Save Settings"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
