"use client";

import Link from "next/link";
import { ChevronLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
    return (
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center p-6">
            <div className="w-full max-w-md space-y-8 bg-zinc-900 p-10 rounded-[2.5rem] ring-1 ring-zinc-800 shadow-2xl">
                <div className="text-center">
                    <div className="h-16 w-16 bg-orange-600/10 rounded-2xl flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-8 w-8 text-orange-500" />
                    </div>
                    <h1 className="text-3xl font-black mb-2 tracking-tight">FORGOT PASSWORD?</h1>
                    <p className="text-zinc-500 text-sm uppercase font-bold tracking-widest">No worries, it happens.</p>
                </div>

                <div className="space-y-6">
                    <p className="text-zinc-400 text-center leading-relaxed">
                        Password reset functionality is currently under development. Please contact your administrator or try a different account.
                    </p>

                    <Link
                        href="/login"
                        className="flex items-center justify-center gap-2 w-full py-4 bg-zinc-800 hover:bg-zinc-700 rounded-2xl font-black uppercase tracking-widest transition-all active:scale-95"
                    >
                        <ChevronLeft className="h-4 w-4" /> Back to Login
                    </Link>
                </div>
            </div>
        </main>
    );
}
