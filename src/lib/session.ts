import { authOptions } from "@/lib/auth";
import { getServerSession } from "next-auth";

export async function getSession() {
    return await getServerSession(authOptions);
}

export async function getCurrentUser() {
    const session = await getSession();
    return session?.user;
}
