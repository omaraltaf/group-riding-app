"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import {
    MapPin,
    Calendar,
    Plus,
    ChevronRight,
    Shield,
    User as UserIcon,
    Settings,
    LogOut,
    Car as CarIcon,
    Trophy,
    Check,
    X,
    Link as LinkIcon,
    Copy,
    Clock,
    Mountain,
    Globe,
    Bike,
    Compass,
    Motorbike,
    MoreVertical,
    UserPlus,
    UserMinus,
    UserCog
} from "lucide-react";
import Link from "next/link";

interface Member {
    id: string;
    userId: string;
    name: string;
    image: string;
    role: string;
    status: string;
    user: {
        id: string;
        name: string;
        image: string;
        vehicleTypes: string;
        vehicleExperience: string;
    };
}

interface Trip {
    id: string;
    title: string;
    startTime: string;
    meetingPoint: string;
    isPublic: boolean;
}

interface Group {
    id: string;
    name: string;
    description: string;
    joinPolicy: string;
    inviteCode: string;
    isAdmin: boolean;
    isPlatformAdmin: boolean;
    isMember: boolean;
    myStatus: string;
    status: string;
    category: string;
    creatorId: string;
    memberships: Member[];
    trips: Trip[];
    _count: {
        memberships: number;
        trips: number;
    };
}

export default function GroupDetailPage({ params }: { params: Promise<{ groupId: string }> }) {
    const { groupId } = use(params);
    const router = useRouter();
    const [group, setGroup] = useState<Group | null>(null);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState("trips");
    const [copied, setCopied] = useState(false);
    const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
    const [showApprovalConfirm, setShowApprovalConfirm] = useState(false);
    const [pendingStatus, setPendingStatus] = useState<string | null>(null);
    const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
    const [isUpdatingRole, setIsUpdatingRole] = useState<string | null>(null);

    useEffect(() => {
        fetch(`/api/groups/${groupId}`)
            .then(async res => {
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch group");
                const data = await res.json();
                setGroup(data);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, [groupId]);

    const handleGroupApproval = async (status: string) => {
        setPendingStatus(status);
        setShowApprovalConfirm(true);
    };

    const confirmGroupApproval = async () => {
        if (!pendingStatus) return;

        setIsUpdatingStatus(true);
        try {
            const res = await fetch(`/api/groups/${groupId}`, {
                method: "PATCH",
                body: JSON.stringify({ status: pendingStatus }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingStatus(false);
            setShowApprovalConfirm(false);
        }
    };

    const handleJoin = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "POST",
            });
            if (res.ok) {
                window.location.reload();
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleStatusUpdate = async (userId: string, status: string) => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "PATCH",
                body: JSON.stringify({ userId, status }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setGroup(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        memberships: (prev.memberships || []).map(m =>
                            m.userId === userId ? { ...m, status } : m
                        )
                    };
                });
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleRoleUpdate = async (userId: string, role: string, userName: string) => {
        const action = role === "ADMIN" ? "promote to Organizer" : "remove as Organizer";
        if (!confirm(`Are you sure you want to ${action} ${userName}?`)) return;

        setIsUpdatingRole(userId);
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "PATCH",
                body: JSON.stringify({ userId, role }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setGroup(prev => {
                    if (!prev) return null;
                    return {
                        ...prev,
                        memberships: (prev.memberships || []).map(m =>
                            m.userId === userId ? { ...m, role } : m
                        )
                    };
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setIsUpdatingRole(null);
        }
    };

    const copyInvite = () => {
        if (!group?.inviteCode) return;
        const url = `${window.location.origin}/join/${group.inviteCode}`;
        navigator.clipboard.writeText(url);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    const handleLeaveGroup = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setShowLeaveConfirm(true);
    };

    const confirmLeave = async () => {
        try {
            const res = await fetch(`/api/groups/${groupId}/members`, {
                method: "DELETE",
            });
            if (res.ok) {
                router.push("/groups");
            }
        } catch (err) {
            console.error(err);
        } finally {
            setShowLeaveConfirm(false);
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    if (!group) return null;

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="h-64 bg-zinc-900 border-b border-zinc-800 relative">
                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 to-transparent"></div>
                <div className="mx-auto max-w-5xl px-6 h-full flex flex-col justify-end pb-8 relative z-10">
                    <div className="flex justify-between items-end">
                        <div>
                            <div className="flex items-center gap-3 mb-3">
                                <h1 className="text-4xl font-black tracking-tight">{group.name}</h1>
                                <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500 ring-1 ring-inset ring-orange-500/20">
                                    {group.category === "BIKES" && <Motorbike className="h-3 w-3" />}
                                    {group.category === "CARS_4X4" && <CarIcon className="h-3 w-3" />}
                                    {group.category === "CYCLING" && <Bike className="h-3 w-3" />}
                                    {group.category === "EXCURSIONS" && <Compass className="h-3 w-3" />}
                                    {group.category === "BIKES" ? "Bike Group" :
                                        group.category === "CARS_4X4" ? "Cars/4x4 Group" :
                                            group.category === "CYCLING" ? "Cycling Group" :
                                                group.category === "EXCURSIONS" ? "Excursion Group" : group.category}
                                </span>
                            </div>
                            <p className="text-zinc-400 max-w-2xl">{group.description}</p>
                        </div>
                        {group.isAdmin && (
                            <Link href={`/groups/${groupId}/settings`} className="rounded-xl bg-zinc-800 p-3 hover:bg-zinc-700 transition-all ring-1 ring-zinc-700">
                                <Settings className="h-6 w-6 text-zinc-300" />
                            </Link>
                        )}
                    </div>
                </div>
            </div>

            <div className="mx-auto max-w-5xl px-6 -mt-6 relative z-20">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    <div className="lg:col-span-2 space-y-8">
                        {/* Status Messages */}
                        {!group.isMember && group.myStatus !== "PENDING" && (
                            <div className="p-6 bg-orange-600 rounded-2xl flex items-center justify-between shadow-xl shadow-orange-950/20">
                                <div>
                                    <h3 className="font-bold text-lg">Join this group!</h3>
                                    <p className="text-orange-100 text-sm">Join to see planned trips and connect with members.</p>
                                </div>
                                <button
                                    onClick={handleJoin}
                                    className="bg-white text-orange-600 px-6 py-2 rounded-xl font-bold hover:bg-orange-50 transition-all shadow-lg active:scale-95"
                                >
                                    Join Group
                                </button>
                            </div>
                        )}

                        {group.myStatus === "PENDING" && (
                            <div className="p-6 bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 flex items-center gap-4">
                                <div className="h-10 w-10 bg-zinc-800 rounded-full flex items-center justify-center">
                                    <Clock className="h-5 w-5 text-zinc-500" />
                                </div>
                                <div>
                                    <h3 className="font-bold">Request Pending</h3>
                                    <p className="text-zinc-500 text-sm">An admin will review your request shortly.</p>
                                </div>
                            </div>
                        )}

                        {group.status === "PENDING" && (
                            <div className="p-6 bg-orange-600/10 rounded-2xl ring-1 ring-orange-500/20 flex items-center justify-between gap-4 border-l-4 border-orange-500 shadow-xl shadow-orange-950/10">
                                <div className="flex items-center gap-4">
                                    <div className="h-10 w-10 bg-orange-500/20 rounded-full flex items-center justify-center">
                                        <Shield className="h-5 w-5 text-orange-500" />
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-orange-500">Group Pending Approval</h3>
                                        <p className="text-zinc-400 text-sm">This group is currently pending approval from platform admins. it is only visible to you and admins.</p>
                                    </div>
                                </div>

                                {group.isPlatformAdmin && (
                                    <div className="flex gap-2 shrink-0">
                                        <button
                                            disabled={isUpdatingStatus}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleGroupApproval("REJECTED");
                                            }}
                                            className="px-4 py-2 rounded-xl bg-zinc-800 text-zinc-400 font-bold hover:bg-red-500/10 hover:text-red-500 transition-all ring-1 ring-zinc-700 disabled:opacity-50"
                                        >
                                            Reject
                                        </button>
                                        <button
                                            disabled={isUpdatingStatus}
                                            onClick={(e) => {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleGroupApproval("APPROVED");
                                            }}
                                            className="px-6 py-2 rounded-xl bg-orange-600 text-white font-bold hover:bg-orange-500 transition-all shadow-lg active:scale-95 disabled:opacity-50"
                                        >
                                            Approve Group
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Tabs */}
                        <div className="flex items-center gap-8 border-b border-zinc-800 mb-6 px-2">
                            <button
                                onClick={() => setActiveTab("trips")}
                                className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "trips" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                Trips ({group.trips?.length || 0})
                                {activeTab === "trips" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>}
                            </button>
                            <button
                                onClick={() => setActiveTab("members")}
                                className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "members" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
                                    }`}
                            >
                                Members ({group.memberships?.filter(m => m.status === "APPROVED").length || 0})
                                {activeTab === "members" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>}
                            </button>
                            {(group.isAdmin) && (
                                <button
                                    onClick={() => setActiveTab("requests")}
                                    className={`pb-4 text-sm font-semibold transition-all relative ${activeTab === "requests" ? "text-orange-500" : "text-zinc-500 hover:text-zinc-300"
                                        }`}
                                >
                                    Join Requests ({group.memberships?.filter(m => m.status === "PENDING").length || 0})
                                    {activeTab === "requests" && <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-orange-500 rounded-full"></div>}
                                </button>
                            )}
                        </div>

                        {/* Tab Content */}
                        <div className="space-y-4">
                            {activeTab === "trips" && (
                                <>
                                    <div className="flex justify-between items-center mb-6">
                                        <h3 className="text-xl font-semibold">Upcoming Trips</h3>
                                        {group.isAdmin && (
                                            <Link
                                                href={`/groups/${group.id}/trips/create`}
                                                className="flex items-center gap-2 rounded-lg bg-zinc-800 px-3 py-1.5 text-xs font-bold hover:bg-zinc-700 transition-colors"
                                            >
                                                <Plus className="h-3 w-3" /> New Trip
                                            </Link>
                                        )}
                                    </div>
                                    {group.trips?.length === 0 ? (
                                        <div className="p-12 text-center bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                                            <Calendar className="h-10 w-10 text-zinc-700 mx-auto mb-4" />
                                            <p className="text-zinc-500">No trips planned yet.</p>
                                        </div>
                                    ) : (
                                        (group.trips || []).map((trip: any) => (
                                            <Link
                                                key={trip.id}
                                                href={`/trips/${trip.id}`}
                                                className="p-4 bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 hover:ring-orange-500/30 transition-all flex justify-between items-center group cursor-pointer block"
                                            >
                                                <div className="flex gap-4">
                                                    <div className="h-12 w-12 bg-zinc-800 rounded-xl flex flex-col items-center justify-center font-bold text-xs">
                                                        <span>{new Date(trip.startTime).toLocaleString('en-US', { month: 'short' }).toUpperCase()}</span>
                                                        <span className="text-lg leading-none">{new Date(trip.startTime).getDate()}</span>
                                                    </div>
                                                    <div>
                                                        <h4 className="font-bold group-hover:text-orange-500 transition-colors uppercase tracking-tight">{trip.title}</h4>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                                            <span className="flex items-center gap-1"><MapPin className="h-3 w-3 text-orange-600" /> {trip.meetingPoint || "TBD"}</span>
                                                            <span className="flex items-center gap-1"><Clock className="h-3 w-3 text-orange-600" /> {new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <ChevronRight className="h-5 w-5 text-zinc-700 group-hover:text-orange-500 transition-all" />
                                            </Link>
                                        ))
                                    )}
                                </>
                            )}

                            {activeTab === "members" && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    {(group.memberships || []).filter(m => m.status === "APPROVED").map(member => (
                                        <div key={member.id} className="p-4 bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 flex items-center justify-between">
                                            <div className="flex items-center gap-3">
                                                <div className="h-10 w-10 rounded-full bg-zinc-800 flex items-center justify-center relative">
                                                    <UserIcon className="h-5 w-5 text-zinc-500" />
                                                    {member.role === "ADMIN" && (
                                                        <div className="absolute -top-1 -right-1 bg-orange-600 rounded-full p-1 ring-2 ring-zinc-900">
                                                            <Shield className="h-2 w-2 text-white" />
                                                        </div>
                                                    )}
                                                </div>
                                                <Link href={`/profile/${member.userId}`} className="hover:underline">
                                                    <p className="text-sm font-bold flex items-center gap-1.5">
                                                        {member.user.name}
                                                        {member.userId === group.creatorId && (
                                                            <span className="inline-flex items-center rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-500 ring-1 ring-inset ring-orange-500/20 uppercase tracking-wider">
                                                                Founder
                                                            </span>
                                                        )}
                                                    </p>
                                                    <p className="text-xs text-zinc-500">{member.role === "ADMIN" ? "Organizer" : "Member"}</p>
                                                </Link>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                {group.isAdmin && member.userId !== group.creatorId && (
                                                    <button
                                                        onClick={() => handleRoleUpdate(member.userId, member.role === "ADMIN" ? "MEMBER" : "ADMIN", member.user.name)}
                                                        disabled={isUpdatingRole === member.userId}
                                                        title={member.role === "ADMIN" ? "Remove Organizer" : "Make Organizer"}
                                                        className={`p-2 rounded-xl transition-all disabled:opacity-50 ${member.role === "ADMIN"
                                                            ? "bg-orange-500/10 text-orange-500 hover:bg-orange-500/20 ring-1 ring-orange-500/20"
                                                            : "bg-zinc-800 text-zinc-500 hover:text-zinc-300 hover:bg-zinc-700 ring-1 ring-zinc-700"
                                                            }`}
                                                    >
                                                        {isUpdatingRole === member.userId ? (
                                                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                                        ) : (
                                                            <Shield className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                )}
                                                <div className="flex gap-2">
                                                    {member.user.vehicleExperience && (
                                                        <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center" title={member.user.vehicleExperience}>
                                                            <Trophy className="h-4 w-4 text-zinc-500" />
                                                        </div>
                                                    )}
                                                    {member.user.vehicleTypes && (
                                                        <div className="h-8 w-8 rounded-lg bg-zinc-800 flex items-center justify-center" title={member.user.vehicleTypes}>
                                                            <CarIcon className="h-4 w-4 text-zinc-500" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeTab === "requests" && (
                                <div className="space-y-3">
                                    {(group.memberships || []).filter(m => m.status === "PENDING").length === 0 ? (
                                        <div className="p-12 text-center bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                                            <p className="text-zinc-500 font-medium">No pending requests.</p>
                                        </div>
                                    ) : (
                                        (group.memberships || []).filter(m => m.status === "PENDING").map(member => (
                                            <div key={member.id} className="p-6 bg-zinc-900 rounded-2xl ring-1 ring-zinc-800 flex items-center justify-between">
                                                <div className="flex items-center gap-4">
                                                    <div className="h-12 w-12 rounded-full bg-zinc-800 flex items-center justify-center">
                                                        <UserIcon className="h-6 w-6 text-zinc-500" />
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-lg">{member.user.name}</p>
                                                        <div className="flex items-center gap-3 text-xs text-zinc-500 mt-1">
                                                            <span className="flex items-center gap-1"><Trophy className="h-3 w-3" /> {member.user.vehicleExperience}</span>
                                                            <span className="flex items-center gap-1"><CarIcon className="h-3 w-3" /> {member.user.vehicleTypes || "None"}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => handleStatusUpdate(member.userId, "REJECTED")}
                                                        className="p-2.5 rounded-xl bg-zinc-800 text-zinc-400 hover:bg-red-500/10 hover:text-red-500 transition-all ring-1 ring-zinc-700"
                                                    >
                                                        <X className="h-5 w-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleStatusUpdate(member.userId, "APPROVED")}
                                                        className="p-2.5 rounded-xl bg-orange-600 text-white hover:bg-orange-500 transition-all shadow-lg active:scale-95"
                                                    >
                                                        <Check className="h-5 w-5" />
                                                    </button>
                                                </div>
                                            </div>
                                        ))
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="p-6 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                            <h3 className="font-bold mb-4 flex items-center gap-2">
                                <LinkIcon className="h-4 w-4 text-orange-500" /> Invite Link
                            </h3>
                            <p className="text-sm text-zinc-500 mb-4">Share this link to invite other participants to join the group.</p>
                            <button
                                onClick={copyInvite}
                                className={`w-full flex items-center justify-between gap-2 px-4 py-3 rounded-xl ring-1 transition-all ${copied ? "bg-emerald-500/10 ring-emerald-500/20 text-emerald-500" : "bg-zinc-800 ring-zinc-700 text-zinc-400 hover:bg-zinc-700"
                                    }`}
                            >
                                <span className="text-xs font-mono truncate mr-2">
                                    {copied ? "Copied to clipboard!" : (group.inviteCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/join/${group.inviteCode}` : "No code available")}
                                </span>
                                <Copy className="h-4 w-4 shrink-0" />
                            </button>
                        </div>

                        <div className="p-6 bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                            <h3 className="font-bold mb-4">Group Stats</h3>
                            <div className="space-y-4">
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Founded</span>
                                    <span className="font-medium text-zinc-300">FEB 2026</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Privacy</span>
                                    <span className="font-medium text-zinc-300">{group.joinPolicy === "OPEN" ? "Open" : "Private"}</span>
                                </div>
                                <div className="flex justify-between items-center text-sm">
                                    <span className="text-zinc-500">Trips Done</span>
                                    <span className="font-medium text-zinc-300">0</span>
                                </div>
                            </div>
                        </div>

                        {group.isMember && (
                            <button
                                type="button"
                                onClick={handleLeaveGroup}
                                className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-red-500/5 text-red-500 ring-1 ring-red-500/10 hover:bg-red-500/10 transition-all font-semibold text-sm"
                            >
                                <LogOut className="h-4 w-4" /> Leave Group
                            </button>
                        )}
                    </div>
                </div>
            </div>
            {showLeaveConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="h-16 w-16 bg-red-500/10 rounded-2xl flex items-center justify-center mb-6">
                            <LogOut className="h-8 w-8 text-red-500" />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Leave Group?</h2>
                        <p className="text-zinc-400 mb-8">Are you sure you want to leave this group? You will need an invite or request access to join again.</p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmLeave}
                                className="w-full py-4 bg-red-600 hover:bg-red-500 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                            >
                                Yes, Leave Group
                            </button>
                            <button
                                onClick={() => setShowLeaveConfirm(false)}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98]"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {showApprovalConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="w-full max-w-md bg-zinc-900 border border-zinc-800 rounded-3xl p-8 shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className={`h-16 w-16 ${pendingStatus === "APPROVED" ? "bg-emerald-500/10" : "bg-red-500/10"} rounded-2xl flex items-center justify-center mb-6`}>
                            {pendingStatus === "APPROVED" ? (
                                <Check className={`h-8 w-8 text-emerald-500`} />
                            ) : (
                                <X className={`h-8 w-8 text-red-500`} />
                            )}
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">
                            {pendingStatus === "APPROVED" ? "Approve Group?" : "Reject Group?"}
                        </h2>
                        <p className="text-zinc-400 mb-8">
                            {pendingStatus === "APPROVED"
                                ? `Are you sure you want to approve "${group.name}"? It will become visible in discovery.`
                                : `Are you sure you want to reject "${group.name}"? The creator will be notified.`}
                        </p>
                        <div className="flex flex-col gap-3">
                            <button
                                onClick={confirmGroupApproval}
                                disabled={isUpdatingStatus}
                                className={`w-full py-4 ${pendingStatus === "APPROVED" ? "bg-orange-600 hover:bg-orange-500" : "bg-red-600 hover:bg-red-500"} text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50`}
                            >
                                {isUpdatingStatus ? "Processing..." : (pendingStatus === "APPROVED" ? "Yes, Approve Group" : "Yes, Reject Group")}
                            </button>
                            <button
                                onClick={() => setShowApprovalConfirm(false)}
                                disabled={isUpdatingStatus}
                                className="w-full py-4 bg-zinc-800 hover:bg-zinc-700 text-white font-bold rounded-2xl transition-all active:scale-[0.98] disabled:opacity-50"
                            >
                                Cancel
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </main>
    );
}
