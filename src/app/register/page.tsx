"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function RegisterPage() {
    const router = useRouter();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        const formData = new FormData(e.currentTarget);
        const email = formData.get("email") as string;
        const password = formData.get("password") as string;
        const name = formData.get("name") as string;
        const phone = formData.get("phone") as string;

        try {
            const res = await fetch("/api/register", {
                method: "POST",
                body: JSON.stringify({ email, password, name, phone }),
                headers: { "Content-Type": "application/json" },
            });

            if (res.ok) {
                router.push("/login");
            } else {
                const text = await res.text();
                setError(text || "Something went wrong");
            }
        } catch {
            setError("An unexpected error occurred");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-screen items-center justify-center bg-zinc-950 px-4">
            <div className="w-full max-w-md space-y-8 rounded-2xl bg-zinc-900 p-8 shadow-2xl ring-1 ring-zinc-800">
                <div className="text-center">
                    <h2 className="text-3xl font-bold tracking-tight text-white">Create Account</h2>
                    <p className="mt-2 text-zinc-400">Join the TripKarLo community</p>
                </div>
                <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
                    {error && (
                        <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500 ring-1 ring-red-500/20">
                            {error}
                        </div>
                    )}
                    <div className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Full Name</label>
                            <input
                                name="name"
                                type="text"
                                required
                                className="mt-1 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm"
                                placeholder="John Doe"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Email Address</label>
                            <input
                                name="email"
                                type="email"
                                required
                                className="mt-1 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm"
                                placeholder="you@example.com"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Phone Number</label>
                            <input
                                name="phone"
                                type="tel"
                                required
                                className="mt-1 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm"
                                placeholder="+1 234 567 890"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-zinc-300">Password</label>
                            <input
                                name="password"
                                type="password"
                                required
                                className="mt-1 block w-full rounded-lg border-0 bg-zinc-800 py-2.5 text-white shadow-sm ring-1 ring-inset ring-zinc-700 placeholder:text-zinc-500 focus:ring-2 focus:ring-inset focus:ring-orange-500 sm:text-sm"
                                placeholder="••••••••"
                            />
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="flex w-full justify-center rounded-lg bg-orange-600 px-3 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-orange-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600 disabled:opacity-50 transition-colors"
                    >
                        {loading ? "Creating account..." : "Sign up"}
                    </button>

                    <p className="text-center text-sm text-zinc-400">
                        Already have an account?{" "}
                        <Link href="/login" className="font-semibold text-orange-500 hover:text-orange-400">
                            Sign in
                        </Link>
                    </p>
                </form>
            </div>
        </div>
    );
}
