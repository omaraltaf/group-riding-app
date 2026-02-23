"use client";

import { useState, useEffect, use } from "react";
import {
    ChevronLeft,
    Calendar,
    MapPin,
    Clock,
    Users,
    Trophy,
    Bike,
    MessageSquare,
    CheckCircle2,
    HelpCircle,
    XCircle,
    Share2,
    AlertTriangle,
    Send as SendIcon,
    ExternalLink
} from "lucide-react";
import Link from "next/link";

interface RSVP {
    id: string;
    status: string;
    user: {
        id: string;
        name: string;
        image: string;
        bikeTypes: string;
        ridingExperience: string;
    };
}

interface Ride {
    id: string;
    title: string;
    description: string;
    startTime: string;
    meetingPoint: string;
    meetingPointUrl?: string | null;
    destination?: string | null;
    destinationUrl?: string | null;
    itinerary: string;
    terrainDifficulty: string;
    suitableBikes: string;
    riderCap: number | null;
    isPublic: boolean;
    groupId: string;
    group: {
        id: string;
        name: string;
    };
    rsvps: RSVP[];
    isAdmin: boolean;
    isCreator: boolean;
    myRsvp: string | null;
}

export default function RideDetailPage({ params }: { params: Promise<{ rideId: string }> }) {
    const { rideId } = use(params);
    const [ride, setRide] = useState<Ride | null>(null);
    const [loading, setLoading] = useState(true);
    const [rsvpLoading, setRsvpLoading] = useState(false);

    const [copied, setCopied] = useState(false);

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const [messages, setMessages] = useState<any[]>([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);

    useEffect(() => {
        fetch(`/api/rides/${rideId}`)
            .then(res => res.json())
            .then(data => {
                setRide(data);
                setLoading(false);
            })
            .catch(err => console.error(err));

        fetch(`/api/rides/${rideId}/messages`)
            .then(res => res.json())
            .then(data => setMessages(data))
            .catch(err => console.error(err));
    }, [rideId]);

    const handleShare = () => {
        const url = window.location.href;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!newMessage.trim() || sending) return;

        setSending(true);
        try {
            const res = await fetch(`/api/rides/${rideId}/messages`, {
                method: "POST",
                body: JSON.stringify({ content: newMessage }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const msg = await res.json();
                setMessages(prev => [...prev, msg]);
                setNewMessage("");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setSending(false);
        }
    };

    const handleRSVP = async (status: string) => {
        setRsvpLoading(true);
        try {
            const res = await fetch(`/api/rides/${rideId}/rsvp`, {
                method: "POST",
                body: JSON.stringify({ status }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                const updatedRsvp = await res.json();
                setRide(prev => {
                    if (!prev) return null;
                    return { ...prev, myRsvp: updatedRsvp.status };
                });
                // Refresh full data to show updated RSVP list
                const refreshRes = await fetch(`/api/rides/${rideId}`);
                const refreshData = await refreshRes.json();
                setRide(refreshData);
            }
        } catch (err) {
            console.error(err);
        } finally {
            setRsvpLoading(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!ride) return null;

    const confirmedCount = ride.rsvps.filter(r => r.status === "CONFIRMED").length;
    const isFull = ride.riderCap ? confirmedCount >= ride.riderCap : false;

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">
                <div className="flex items-center gap-3 mb-8 text-zinc-400">
                    <Link href={`/groups/${ride.groupId}`} className="hover:text-white transition-colors flex items-center gap-2">
                        <ChevronLeft className="h-4 w-4" /> {ride.group.name}
                    </Link>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                    <div className="lg:col-span-2 space-y-10">
                        <div>
                            <div className="flex items-center gap-2 mb-4">
                                <span className={`px-3 py-1 rounded-full text-xs font-bold ring-1 ${ride.terrainDifficulty === "Expert" ? "bg-red-500/10 text-red-500 ring-red-500/20" :
                                    ride.terrainDifficulty === "Challenging" ? "bg-orange-500/10 text-orange-500 ring-orange-500/20" :
                                        "bg-emerald-500/10 text-emerald-500 ring-emerald-500/20"
                                    }`}>
                                    {ride.terrainDifficulty}
                                </span>
                                {ride.isPublic && (
                                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-zinc-800 text-zinc-400 ring-1 ring-zinc-700">Public Ride</span>
                                )}
                            </div>
                            <div className="flex items-center justify-between gap-4 mb-4">
                                <h1 className="text-4xl font-black">{ride.title}</h1>
                                {(ride.isAdmin || ride.isCreator) && (
                                    <Link
                                        href={`/rides/${rideId}/edit`}
                                        className="shrink-0 flex items-center gap-2 px-6 py-3 rounded-xl bg-zinc-800 text-zinc-300 font-bold hover:bg-zinc-700 transition-all active:scale-95 ring-1 ring-zinc-700"
                                    >
                                        Edit Ride
                                    </Link>
                                )}
                            </div>
                            <p className="text-xl text-zinc-400 leading-relaxed">{ride.description}</p>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800">
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Calendar className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Date</p>
                                        <p className="font-semibold">{new Date(ride.startTime).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Clock className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Start Time</p>
                                        <p className="font-semibold">{new Date(ride.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-4">
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        <MapPin className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Meeting Point</p>
                                        <div className="flex flex-col">
                                            <p className="font-semibold truncate max-w-[200px]">{ride.meetingPoint}</p>
                                            {ride.meetingPointUrl && (
                                                <a
                                                    href={ride.meetingPointUrl}
                                                    target="_blank"
                                                    rel="noopener noreferrer"
                                                    className="text-[10px] text-orange-500 hover:underline flex items-center gap-1 mt-0.5"
                                                >
                                                    View on Maps <ExternalLink className="h-2 w-2" />
                                                </a>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        <Users className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Capacity</p>
                                        <p className="font-semibold">{ride.riderCap ? `${confirmedCount} / ${ride.riderCap} riders` : "Unlimited"}</p>
                                    </div>
                                </div>
                                {ride.destination && (
                                    <div className="flex items-start gap-4">
                                        <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                            <MapPin className="h-5 w-5 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs text-zinc-500 font-bold uppercase tracking-wider">Destination</p>
                                            <div className="flex flex-col">
                                                <p className="font-semibold truncate max-w-[200px]">{ride.destination}</p>
                                                {ride.destinationUrl && (
                                                    <a
                                                        href={ride.destinationUrl}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-[10px] text-emerald-500 hover:underline flex items-center gap-1 mt-0.5"
                                                    >
                                                        View on Maps <ExternalLink className="h-2 w-2" />
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-orange-500" /> Ride Chat
                            </h3>
                            <div className="bg-zinc-900 rounded-[2rem] ring-1 ring-zinc-800 overflow-hidden flex flex-col h-[500px]">
                                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                    {messages.length === 0 ? (
                                        <div className="h-full flex flex-col items-center justify-center text-zinc-600">
                                            <MessageSquare className="h-12 w-12 mb-4 opacity-20" />
                                            <p>No messages yet. Start the conversation!</p>
                                        </div>
                                    ) : (
                                        messages.map((msg) => (
                                            <div key={msg.id} className="flex gap-3">
                                                <div className="h-8 w-8 rounded-full bg-zinc-800 shrink-0 flex items-center justify-center">
                                                    <Users className="h-4 w-4 text-zinc-600" />
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-xs font-bold">{msg.user.name}</span>
                                                        <span className="text-[10px] text-zinc-500">{new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                    </div>
                                                    <div className="px-4 py-3 bg-zinc-800 rounded-2xl rounded-tl-none text-sm text-zinc-200 inline-block max-w-[80%]">
                                                        {msg.content}
                                                    </div>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                                <form onSubmit={handleSendMessage} className="p-4 bg-zinc-950 border-t border-zinc-800 flex gap-3">
                                    <input
                                        type="text"
                                        placeholder="Type a message..."
                                        value={newMessage}
                                        onChange={(e) => setNewMessage(e.target.value)}
                                        className="flex-1 bg-zinc-900 border-0 rounded-xl px-4 py-3 text-sm text-white ring-1 ring-zinc-800 focus:ring-2 focus:ring-orange-500 transition-all"
                                    />
                                    <button
                                        type="submit"
                                        disabled={sending || !newMessage.trim()}
                                        className="h-12 w-12 bg-orange-600 rounded-xl flex items-center justify-center text-white hover:bg-orange-500 transition-all active:scale-95 disabled:opacity-50"
                                    >
                                        <SendIcon className="h-5 w-5" />
                                    </button>
                                </form>
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <MessageSquare className="h-5 w-5 text-orange-500" /> Itinerary
                            </h3>
                            <div className="p-8 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800 whitespace-pre-wrap text-zinc-300 italic">
                                {ride.itinerary || "Detailed itinerary hasn't been shared yet."}
                            </div>
                        </div>

                        <div className="space-y-6">
                            <h3 className="text-xl font-bold flex items-center gap-2">
                                <Users className="h-5 w-5 text-orange-500" /> Attending ({confirmedCount})
                            </h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {ride.rsvps.filter(r => r.status === "CONFIRMED").map(rsvp => (
                                    <div key={rsvp.id} className="p-4 bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 flex items-center gap-3">
                                        <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center">
                                            <Users className="h-5 w-5 text-zinc-600" />
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold">{rsvp.user.name}</p>
                                            <p className="text-xs text-zinc-500">{rsvp.user.bikeTypes || "Motorcycle"}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="space-y-6">
                        <div className="p-8 bg-zinc-900 rounded-[2.5rem] ring-1 ring-zinc-800 shadow-2xl sticky top-24">
                            <h3 className="text-2xl font-black mb-6">Are you coming?</h3>

                            {isFull && ride.myRsvp !== "CONFIRMED" && (
                                <div className="mb-6 p-4 bg-red-500/10 rounded-2xl ring-1 ring-red-500/20 flex items-center gap-3 text-red-500 text-sm">
                                    <AlertTriangle className="h-5 w-5 shrink-0" />
                                    <p>This ride has reached its maximum capacity.</p>
                                </div>
                            )}

                            <div className="space-y-3">
                                <button
                                    onClick={() => handleRSVP("CONFIRMED")}
                                    disabled={rsvpLoading || (isFull && ride.myRsvp !== "CONFIRMED")}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${ride.myRsvp === "CONFIRMED"
                                        ? "bg-emerald-600 text-white shadow-lg shadow-emerald-950/20"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700 disabled:opacity-50"
                                        }`}
                                >
                                    <span>Confirm Attendance</span>
                                    <CheckCircle2 className={`h-5 w-5 ${ride.myRsvp === "CONFIRMED" ? "text-emerald-200" : "text-zinc-600"}`} />
                                </button>

                                <button
                                    onClick={() => handleRSVP("MAYBE")}
                                    disabled={rsvpLoading}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${ride.myRsvp === "MAYBE"
                                        ? "bg-blue-600 text-white shadow-lg shadow-blue-950/20"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    <span>Maybe</span>
                                    <HelpCircle className={`h-5 w-5 ${ride.myRsvp === "MAYBE" ? "text-blue-200" : "text-zinc-600"}`} />
                                </button>

                                <button
                                    onClick={() => handleRSVP("DECLINED")}
                                    disabled={rsvpLoading}
                                    className={`w-full flex items-center justify-between px-6 py-4 rounded-2xl font-bold transition-all ${ride.myRsvp === "DECLINED"
                                        ? "bg-red-600 text-white shadow-lg shadow-red-950/20"
                                        : "bg-zinc-800 text-zinc-300 hover:bg-zinc-700"
                                        }`}
                                >
                                    <span>Can&apos;t Make It</span>
                                    <XCircle className={`h-5 w-5 ${ride.myRsvp === "DECLINED" ? "text-red-200" : "text-zinc-600"}`} />
                                </button>
                            </div>

                            <div className="mt-10 pt-8 border-t border-zinc-800 space-y-6">
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        <Trophy className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <p className="text-sm text-zinc-400">Experience: <span className="text-white font-medium">{ride.terrainDifficulty}</span></p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 bg-zinc-800 rounded-lg flex items-center justify-center">
                                        <Bike className="h-4 w-4 text-zinc-500" />
                                    </div>
                                    <p className="text-sm text-zinc-400">Suitable for: <span className="text-white font-medium">{ride.suitableBikes || "Any bike"}</span></p>
                                </div>
                            </div>

                            <button
                                onClick={handleShare}
                                className={`w-full mt-10 py-4 rounded-2xl font-bold transition-all flex items-center justify-center gap-2 ${copied ? "bg-emerald-500/10 text-emerald-500 outline outline-1 outline-emerald-500/20" : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700"
                                    }`}
                            >
                                <Share2 className="h-4 w-4" />
                                {copied ? "Link Copied!" : "Share Ride"}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
