"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import {
    ChevronLeft,
    Save,
    MapPin,
    Calendar,
    Clock,
    Info,
    Mountain,
    Car,
    Users,
    Globe,
    Lock
} from "lucide-react";
import Link from "next/link";
import AddressAutocomplete from "@/components/address-autocomplete";

export default function CreateTripPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
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
        suitableVehicles: "",
        participantCap: "",
        isPublic: false,
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const res = await fetch(`/api/groups/${groupId}/trips`, {
                method: "POST",
                body: JSON.stringify(formData),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                router.push(`/groups/${groupId}`);
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
                    <Link href={`/groups/${groupId}`} className="flex items-center gap-2 text-zinc-400 hover:text-white transition-colors">
                        <ChevronLeft className="h-5 w-5" />
                        <span>Back to Group</span>
                    </Link>
                    <h1 className="text-xl font-bold">New Trip</h1>
                    <div className="w-20"></div>
                </div>
            </nav>

            <div className="mx-auto max-w-3xl px-6 pt-12">
                <form onSubmit={handleSubmit} className="space-y-8">
                    <section className="bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl space-y-6">
                        <h3 className="text-lg font-bold flex items-center gap-2 text-zinc-400">
                            <Info className="h-5 w-5" /> General Details
                        </h3>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400">Trip Title</label>
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
                                placeholder="What is the plan for this trip?"
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
                                    <Users className="h-4 w-4" /> Participant Capacity
                                </label>
                                <input
                                    type="number"
                                    value={formData.participantCap}
                                    onChange={(e) => setFormData({ ...formData, participantCap: e.target.value })}
                                    className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                    placeholder="Unlimited if empty"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                <Car className="h-4 w-4" /> Suitable Vehicle Types
                            </label>
                            <input
                                type="text"
                                value={formData.suitableVehicles}
                                onChange={(e) => setFormData({ ...formData, suitableVehicles: e.target.value })}
                                className="w-full rounded-2xl bg-zinc-800 border-0 py-4 px-5 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 transition-all"
                                placeholder="e.g. Bikes, Cars, SUVs, 4x4s, Any"
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
                                    <h3 className="font-bold text-white">Public Trip</h3>
                                    <p className="text-sm text-zinc-500">Visible to participants outside this group.</p>
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
                            href={`/groups/${groupId}`}
                            className="rounded-xl bg-zinc-900 px-8 py-4 font-semibold text-zinc-400 hover:bg-zinc-800 transition-all"
                        >
                            Cancel
                        </Link>
                        <button
                            type="submit"
                            disabled={loading}
                            className="flex items-center gap-2 rounded-xl bg-orange-600 px-10 py-4 font-semibold text-white shadow-xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                        >
                            <Save className="h-5 w-5" /> {loading ? "Creating..." : "Create Trip"}
                        </button>
                    </div>
                </form>
            </div>
        </main>
    );
}
