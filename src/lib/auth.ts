import { NextAuthOptions } from "next-auth";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const authOptions: NextAuthOptions = {
    adapter: PrismaAdapter(prisma),
    session: {
        strategy: "jwt",
    },
    pages: {
        signIn: "/login",
    },
    providers: [
        CredentialsProvider({
            name: "credentials",
            credentials: {
                email: { label: "Email", type: "email" },
                password: { label: "Password", type: "password" },
            },
            async authorize(credentials) {
                if (!credentials?.email || !credentials?.password) {
                    throw new Error("Invalid credentials");
                }

                console.log("[Auth] Attempting login for:", credentials.email);
                const user = await prisma.user.findUnique({
                    where: {
                        email: credentials.email,
                    },
                }) as any;

                if (!user) {
                    console.log("[Auth] User not found:", credentials.email);
                    throw new Error("Invalid credentials");
                }

                if (!user.password) {
                    console.log("[Auth] User has no password hash:", credentials.email);
                    throw new Error("Invalid credentials");
                }

                const isPasswordCorrect = await bcrypt.compare(
                    credentials.password,
                    user.password
                );

                if (!isPasswordCorrect) {
                    console.log("[Auth] Password mismatch for:", credentials.email);
                    throw new Error("Invalid credentials");
                }

                console.log("[Auth] Login successful for:", credentials.email);

                return {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    role: user.role,
                } as any; // eslint-disable-line @typescript-eslint/no-explicit-any
            },
        }),
    ],
    callbacks: {
        async jwt({ token, user }) {
            if (user) {
                token.role = user.role;
                token.id = user.id;
            }
            return token;
        },
        async session({ session, token }) {
            if (token && session.user) {
                session.user.role = token.role;
                session.user.id = token.id;
            }
            return session;
        },
    },
};
