"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import { Check, Loader2, Users, AlertCircle, ChevronRight } from "lucide-react";
import Link from "next/link";

export default function JoinGroupPage({ params }: { params: Promise<{ inviteCode: string }> }) {
    const { inviteCode } = use(params);
    const router = useRouter();
    const [status, setStatus] = useState<"loading" | "success" | "pending" | "error">("loading");
    const [groupId, setGroupId] = useState<string | null>(null);

    useEffect(() => {
        const joinGroup = async () => {
            try {
                const res = await fetch(`/api/groups/join/${inviteCode}`, {
                    method: "POST",
                });

                if (res.ok) {
                    const data = await res.json();
                    setGroupId(data.groupId);
                    if (data.status === "APPROVED" || data.status === "ALREADY_MEMBER") {
                        setStatus("success");
                        setTimeout(() => {
                            router.push(`/groups/${data.groupId}`);
                        }, 2000);
                    } else {
                        setStatus("pending");
                    }
                } else if (res.status === 401) {
                    router.push(`/login?callbackUrl=/join/${inviteCode}`);
                } else {
                    setStatus("error");
                }
            } catch {
                setStatus("error");
            }
        };

        joinGroup();
    }, [inviteCode, router]);

    return (
        <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center p-6">
            <div className="max-w-md w-full bg-zinc-900 rounded-3xl p-8 ring-1 ring-zinc-800 shadow-2xl text-center">
                {status === "loading" && (
                    <div className="space-y-6">
                        <Loader2 className="h-12 w-12 text-orange-500 animate-spin mx-auto" />
                        <h1 className="text-2xl font-bold">Joining group...</h1>
                        <p className="text-zinc-500">Please wait while we process your invitation.</p>
                    </div>
                )}

                {status === "success" && (
                    <div className="space-y-6">
                        <div className="h-20 w-20 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Check className="h-10 w-10 text-emerald-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">You&apos;re in!</h1>
                            <p className="text-zinc-500 mt-2">Redirecting you to the group dashboard...</p>
                        </div>
                        <Link
                            href={`/groups/${groupId}`}
                            className="flex items-center justify-center gap-2 w-full py-4 bg-orange-600 rounded-2xl font-bold hover:bg-orange-500 transition-all mt-8"
                        >
                            Continue <ChevronRight className="h-5 w-5" />
                        </Link>
                    </div>
                )}

                {status === "pending" && (
                    <div className="space-y-6">
                        <div className="h-20 w-20 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                            <Users className="h-10 w-10 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Request Sent</h1>
                            <p className="text-zinc-500 mt-2">This is a private group. An admin needs to approve your join request.</p>
                        </div>
                        <Link
                            href="/groups"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800 rounded-2xl font-bold hover:bg-zinc-700 transition-all mt-8"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                )}

                {status === "error" && (
                    <div className="space-y-6">
                        <div className="h-20 w-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto">
                            <AlertCircle className="h-10 w-10 text-red-500" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold">Invalid Invite</h1>
                            <p className="text-zinc-500 mt-2">This invitation link is invalid or has expired.</p>
                        </div>
                        <Link
                            href="/groups"
                            className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800 rounded-2xl font-bold hover:bg-zinc-700 transition-all mt-8"
                        >
                            Back to Dashboard
                        </Link>
                    </div>
                )}
            </div>
        </main>
    );
}
