"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Save,
    MapPin,
    Calendar,
    Clock,
    Info,
    Mountain,
    Bike,
    Users,
    Globe,
    Lock,
    Trash2
} from "lucide-react";
import Link from "next/link";
import AddressAutocomplete from "@/components/address-autocomplete";

export default function EditRidePage({ params }: { params: Promise<{ rideId: string }> }) {
    const { rideId } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [deleting, setDeleting] = useState(false);

    const [formData, setFormData] = useState({
        title: "",
        description: "",
        startTime: "",
        meetingPoint: "",
        meetingPointUrl: "",
        destination: "",
        destinationUrl: "",
        itinerary: "",
        terrainDifficulty: "Easy",
        suitableBikes: "",
        riderCap: "",
        isPublic: false,
    });

    useEffect(() => {
        fetch(`/api/rides/${rideId}`)
            .then(res => res.json())
            .then(data => {
                // Formatting datetime-local value (YYYY-MM-DDTHH:mm)
                const date = new Date(data.startTime);
                const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

                setFormData({
                    title: data.title || "",
                    description: data.description || "",
                    startTime: localDate,
                    meetingPoint: data.meetingPoint || "",
                    meetingPointUrl: data.meetingPointUrl || "",
                    destination: data.destination || "",
                    destinationUrl: data.destinationUrl || "",
                    itinerary: data.itinerary || "",
                    terrainDifficulty: data.terrainDifficulty || "Easy",
                    suitableBikes: data.suitableBikes || "",
                    riderCap: data.riderCap?.toString() || "",
                    isPublic: data.isPublic || false,
                });
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [rideId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);

        try {
            const res = await fetch(`/api/rides/${rideId}`, {
                method: "PATCH",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                router.push(`/rides/${rideId}`);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async () => {
        if (!confirm("Are you sure you want to delete this ride? This action cannot be undone.")) return;

        setDeleting(true);
        try {
            const res = await fetch(`/api/rides/${rideId}`, {
                method: "DELETE",
            });

            if (res.ok) {
                router.push("/dashboard"); // Or back to group if we had groupId handy
            }
        } catch (err) {
            console.error(err);
        } finally {
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
            <nav className="border-b border-zinc-800 bg-zinc-950/50 backdrop-blur-md px-6 py-4 sticky top-0 z-50">
                <div className="mx-auto max-w-3xl flex items-center justify-between">
                    <Link href={`/rides/${rideId}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Back to Ride</span>
                    </Link>
                    <h1 className="text-xl font-bold">Edit Ride</h1>
                    <button
                        onClick={handleDelete}
                        disabled={deleting}
                        className="p-2 text-zinc-400 hover:text-red-500 hover:bg-red-500/10 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                        title="Delete Ride"
                    >
                        <Trash2 className="h-5 w-5" />
                    </button>
                </div>
            </nav>

            <div className="mx-auto max-w-3xl px-6 pt-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-400">
                            <Info className="h-5 w-5" /> General Details
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Ride Title</label>
                            <input
                                required
                                type="text"
                                value={formData.title}
                                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all text-lg"
                                placeholder="e.g. Mountain Pass Weekend"
                            />
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Description</label>
                            <textarea
                                rows={4}
                                value={formData.description}
                                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                placeholder="What is the plan for this ride?"
                            />
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-400">
                            <Calendar className="h-5 w-5" /> Logistics
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Clock className="h-4 w-4" /> Start Time
                                </label>
                                <input
                                    required
                                    type="datetime-local"
                                    value={formData.startTime}
                                    onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                />
                            </div>

                            <AddressAutocomplete
                                required
                                label="Meeting Point"
                                placeholder="Start typing address..."
                                value={formData.meetingPoint}
                                onChange={(address, url) => setFormData({
                                    ...formData,
                                    meetingPoint: address,
                                    meetingPointUrl: url
                                })}
                            />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <AddressAutocomplete
                                label="Destination"
                                placeholder="Where are we heading?"
                                value={formData.destination}
                                icon={<MapPin className="h-4 w-4 text-emerald-500" />}
                                onChange={(address, url) => setFormData({
                                    ...formData,
                                    destination: address,
                                    destinationUrl: url
                                })}
                            />

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Route / Itinerary</label>
                                <textarea
                                    rows={3}
                                    value={formData.itinerary}
                                    onChange={(e) => setFormData({ ...formData, itinerary: e.target.value })}
                                    className="w-full h-[58px] rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="Lunch stops, view points..."
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-400">
                            <Mountain className="h-5 w-5" /> Requirements
                        </h3>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Terrain Difficulty</label>
                                <select
                                    value={formData.terrainDifficulty}
                                    onChange={(e) => setFormData({ ...formData, terrainDifficulty: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 appearance-none"
                                >
                                    <option value="Easy">Easy (Paved)</option>
                                    <option value="Moderate">Moderate (Some gravel)</option>
                                    <option value="Challenging">Challenging (Off-road / Technical)</option>
                                    <option value="Expert">Expert (Expert Only)</option>
                                </select>
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Users className="h-4 w-4" /> Rider Capacity
                                </label>
                                <input
                                    type="number"
                                    value={formData.riderCap}
                                    onChange={(e) => setFormData({ ...formData, riderCap: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="Unlimited if empty"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Bike className="h-4 w-4" /> Suitable Bike Types
                            </label>
                            <input
                                type="text"
                                value={formData.suitableBikes}
                                onChange={(e) => setFormData({ ...formData, suitableBikes: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                placeholder="e.g. Adventure, Sport, Any"
                            />
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    {formData.isPublic ? <Globe className="h-6 w-6 text-orange-500" /> : <Lock className="h-6 w-6 text-zinc-500" />}
                                </div>
                                <div>
                                    <h3 className="font-bold text-white">Public Ride</h3>
                                    <p className="text-sm text-zinc-500">Visible to riders outside this group.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, isPublic: !formData.isPublic })}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isPublic ? "bg-orange-600" : "bg-zinc-700"
                                    }`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isPublic ? "translate-x-6" : "translate-x-1"
                                    }`} />
                            </button>
                        </div>
                    </section>

                    <div className="flex justify-end gap-4">
                        <Link
                            href={`/rides/${rideId}`}
                            className="rounded-xl bg-zinc-900 px-8 py-4 font-semibold text-zinc-400 hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={saving}
                            className="flex items-center gap-2 rounded-xl bg-orange-600 px-10 py-4 font-semibold text-white shadow-xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" /> {saving ? "Saving..." : "Save Changes"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
