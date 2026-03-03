"use client";

import { useState, useEffect } from "react";
import {
    ChevronLeft,
    Bell,
    Check,
    Calendar,
    Users,
    AlertCircle,
    Info,
    Shield
} from "lucide-react";
import Link from "next/link";

interface Notification {
    id: string;
    type: string;
    title: string;
    message: string;
    isRead: boolean;
    createdAt: string;
    relatedId?: string;
}

export default function NotificationsPage() {
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch("/api/notifications")
            .then(async res => {
                if (res.status === 401) {
                    window.location.href = "/login";
                    return;
                }
                if (!res.ok) throw new Error("Failed to fetch notifications");
                const data = await res.json();
                setNotifications(Array.isArray(data) ? data : []);
                setLoading(false);
            })
            .catch(err => {
                console.error(err);
                setLoading(false);
            });
    }, []);

    const markAsRead = async (id: string) => {
        try {
            const res = await fetch("/api/notifications", {
                method: "PATCH",
                body: JSON.stringify({ notificationId: id }),
                headers: { "Content-Type": "application/json" },
            });
            if (res.ok) {
                setNotifications(prev => prev.map(n =>
                    n.id === id ? { ...n, isRead: true } : n
                ));
            }
        } catch (err) {
            console.error(err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "TRIP_UPDATE":
            case "TRIP_NEW":
            case "TRIP_CANCEL":
                return <Calendar className="h-5 w-5 text-orange-500" />;
            case "GROUP_INVITE":
            case "GROUP_JOIN":
                return <Users className="h-5 w-5 text-blue-500" />;
            case "JOIN_REQUEST": return <AlertCircle className="h-5 w-5 text-yellow-500" />;
            case "MESSAGE": return <Info className="h-5 w-5 text-zinc-500" />;
            case "GROUP_CREATE_REQUEST": return <Shield className="h-5 w-5 text-orange-500" />;
            default: return <Info className="h-5 w-5 text-zinc-500" />;
        }
    };

    const getLink = (type: string, relatedId?: string) => {
        if (!relatedId) return null;
        switch (type) {
            case "GROUP_INVITE":
            case "JOIN_REQUEST":
            case "GROUP_JOIN":
            case "JOIN_REJECT":
            case "GROUP_CREATE_REQUEST":
                return `/groups/${relatedId}`;
            case "TRIP_UPDATE":
            case "TRIP_NEW":
            case "TRIP_UPDATE":
            case "TRIP_NEW":
            case "MESSAGE":
            case "TRIP_CANCEL":
            case "TRIP_CANCEL":
                return `/trips/${relatedId}`;
            default:
                return null;
        }
    };

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-zinc-950 text-white">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent"></div>
            </div>
        );
    }

    return (
        <main className="min-h-screen bg-zinc-950 text-white pb-20">
            <div className="mx-auto max-w-5xl px-6 pt-12">

                <div className="flex items-center justify-between mb-12">
                    <div>
                        <h1 className="text-4xl font-black mb-2 tracking-tight">Notifications</h1>
                        <p className="text-zinc-400">Stay updated on your trips and groups.</p>
                    </div>
                    <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
                        <Bell className="h-6 w-6 text-zinc-400" />
                    </div>
                </div>

                <div className="space-y-4">
                    {notifications.length === 0 ? (
                        <div className="p-20 text-center bg-zinc-900 rounded-[2.5rem] ring-1 ring-zinc-800">
                            <Bell className="h-12 w-12 text-zinc-700 mx-auto mb-4" />
                            <h3 className="text-xl font-bold mb-2">All caught up!</h3>
                            <p className="text-zinc-500">You don't have any new notifications at the moment.</p>
                        </div>
                    ) : (
                        notifications.map(notification => {
                            const link = getLink(notification.type, notification.relatedId);
                            const content = (
                                <>
                                    <div className="h-10 w-10 bg-zinc-800 rounded-xl flex items-center justify-center shrink-0">
                                        {getIcon(notification.type)}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between mb-1">
                                            <h3 className="font-bold text-lg truncate">{notification.title}</h3>
                                            <span className="text-[10px] font-bold text-zinc-600 uppercase tracking-widest px-2 py-0.5 bg-zinc-800 rounded-md">
                                                {new Date(notification.createdAt).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="text-zinc-400 text-sm leading-relaxed mb-4">
                                            {notification.message}
                                        </p>
                                        {!notification.isRead && (
                                            <button
                                                onClick={(e) => {
                                                    e.preventDefault();
                                                    e.stopPropagation();
                                                    markAsRead(notification.id);
                                                }}
                                                className="flex items-center gap-1.5 text-xs font-black text-orange-500 hover:text-orange-400 transition-colors uppercase tracking-wider relative z-10"
                                            >
                                                <Check className="h-3 w-3" /> Mark as read
                                            </button>
                                        )}
                                    </div>
                                </>
                            );

                            const cardClasses = `p-6 bg-zinc-900 rounded-3xl ring-1 transition-all flex items-start gap-4 ${notification.isRead ? "ring-zinc-800 border-0 opacity-60" : "ring-orange-500/30 border-l-4 border-orange-500 shadow-xl shadow-orange-950/10"
                                } hover:bg-zinc-800/50`;

                            if (link) {
                                return (
                                    <Link
                                        key={notification.id}
                                        href={link}
                                        className={cardClasses}
                                    >
                                        {content}
                                    </Link>
                                );
                            }

                            return (
                                <div key={notification.id} className={cardClasses}>
                                    {content}
                                </div>
                            );
                        })
                    )}
                </div>
            </div>
        </main>
    );
}
