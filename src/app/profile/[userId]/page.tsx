"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { User, Phone, Bike, Trophy, Bell, Save, ChevronLeft } from "lucide-react";
import Link from "next/link";

export default function UserProfilePage({ params }: { params: Promise<{ userId: string }> }) {
    const { userId } = use(params);
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [fetching, setFetching] = useState(true);
    const [message, setMessage] = useState({ type: "", text: "" });
    const [isMe, setIsMe] = useState(false);
    const [isAdmin, setIsAdmin] = useState(false);

    const [formData, setFormData] = useState({
        name: "",
        phone: "",
        bikeTypes: "",
        ridingExperience: "",
        pushOptIn: false,
        image: "",
    });

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const sessionRes = await fetch("/api/auth/session");
                const session = await sessionRes.json();

                if (!session?.user) {
                    router.push("/login");
                    return;
                }

                setIsMe(session.user.id === userId);
                setIsAdmin(session.user.role === "PLATFORM_ADMIN");

                const userRes = await fetch(`/api/profile/${userId}`);
                if (userRes.ok) {
                    const userData = await userRes.json();
                    setFormData({
                        name: userData.name || "",
                        phone: userData.phone || "",
                        bikeTypes: userData.bikeTypes || "",
                        ridingExperience: userData.ridingExperience || "Beginner",
                        pushOptIn: userData.pushOptIn || false,
                        image: userData.image || "",
                    });
                } else {
                    setMessage({ type: "error", text: "User not found or access denied" });
                }
            } catch (err) {
                console.error("Failed to fetch profile", err);
            } finally {
                setFetching(false);
            }
        };
        fetchProfile();
    }, [router, userId]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: "", text: "" });

        try {
            const res = await fetch("/api/profile", {
                method: "PATCH",
                body: JSON.stringify({
                    ...formData,
                    targetUserId: userId // Backend handles permission check
                }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                setMessage({ type: "success", text: "Profile updated successfully!" });
                router.refresh();
            } else {
                setMessage({ type: "error", text: "Failed to update profile" });
            }
        } catch {
            setMessage({ type: "error", text: "An unexpected error occurred" });
        } finally {
            setLoading(false);
        }
    };

    if (fetching) {
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
                    <div className="flex flex-col gap-4">
                        <Link href={isMe ? "/dashboard" : "/groups"} className="text-zinc-500 hover:text-white flex items-center gap-2 text-sm transition-colors">
                            <ChevronLeft className="h-4 w-4" /> Back
                        </Link>
                        <div>
                            <h1 className="text-4xl font-black mb-2 tracking-tight">
                                {isMe ? "My Profile" : `${formData.name}'s Profile`}
                            </h1>
                            <p className="text-zinc-400">
                                {isMe ? "Manage your bike details and preferences." : `Managing details for ${formData.name}.`}
                            </p>
                        </div>
                    </div>
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
                        <User className="h-6 w-6 text-zinc-400" />
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

                    <section className="bg-zinc-900 rounded-2xl p-8 ring-1 ring-zinc-800">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-400">
                            <User className="h-5 w-5" /> Basic Information
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">Full Name</label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-800 border-0 py-3 px-4 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500"
                                    placeholder="John Doe"
                                    disabled={!isMe && !isAdmin}
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 text-flex flex items-center gap-2">
                                    <Phone className="h-4 w-4" /> Phone Number
                                </label>
                                <input
                                    type="tel"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-800 border-0 py-3 px-4 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500"
                                    placeholder="+1 234 567 890"
                                    disabled={!isMe && !isAdmin}
                                />
                            </div>
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-2xl p-8 ring-1 ring-zinc-800">
                        <h3 className="text-lg font-semibold mb-6 flex items-center gap-2 text-zinc-400">
                            <Bike className="h-5 w-5" /> Riding Profile
                        </h3>
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400">My Bikes</label>
                                <input
                                    type="text"
                                    value={formData.bikeTypes}
                                    onChange={(e) => setFormData({ ...formData, bikeTypes: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-800 border-0 py-3 px-4 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500"
                                    placeholder="e.g. BMW R1250GS, Ducati Panigale"
                                    disabled={!isMe && !isAdmin}
                                />
                                <p className="text-xs text-zinc-500">List your current motorcycles separated by commas.</p>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-zinc-400 flex items-center gap-2">
                                    <Trophy className="h-4 w-4" /> Experience Level
                                </label>
                                <select
                                    value={formData.ridingExperience}
                                    onChange={(e) => setFormData({ ...formData, ridingExperience: e.target.value })}
                                    className="w-full rounded-xl bg-zinc-800 border-0 py-3 px-4 text-white ring-1 ring-zinc-700 focus:ring-2 focus:ring-orange-500 appearance-none"
                                    disabled={!isMe && !isAdmin}
                                >
                                    <option value="Beginner">Beginner (&lt; 1 year)</option>
                                    <option value="Intermediate">Intermediate (1-3 years)</option>
                                    <option value="Advanced">Advanced (3-7 years)</option>
                                    <option value="Professional">Professional (7+ years / Track Pro)</option>
                                </select>
                            </div>
                        </div>
                    </section>

                    <section className="bg-zinc-900 rounded-2xl p-8 ring-1 ring-zinc-800">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="h-10 w-10 rounded-full bg-orange-500/10 flex items-center justify-center">
                                    <Bell className="h-6 w-6 text-orange-500" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white">Push Notifications</h3>
                                    <p className="text-sm text-zinc-500">Get alerts for new rides and RSVP updates.</p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => setFormData({ ...formData, pushOptIn: !formData.pushOptIn })}
                                disabled={!isMe && !isAdmin}
                                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-orange-500 focus:ring-offset-2 focus:ring-offset-zinc-950 ${formData.pushOptIn ? "bg-orange-600" : "bg-zinc-700"
                                    } ${(!isMe && !isAdmin) ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.pushOptIn ? "translate-x-6" : "translate-x-1"
                                    }`} />
                            </button>
                        </div>
                    </section>

                    {(isMe || isAdmin) && (
                        <div className="flex justify-end">
                            <button
                                type="submit"
                                disabled={loading}
                                className="flex items-center gap-2 rounded-xl bg-orange-600 px-8 py-3.5 text-lg font-semibold text-white shadow-xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                            >
                                <Save className="h-5 w-5" /> {loading ? "Saving Changes..." : "Save Changes"}
                            </button>
                        </div>
                    )}
                </form>
            </div>
        </main>
    );
}
