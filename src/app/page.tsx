import { getCurrentUser } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { User, MapPin, Calendar, Users as UsersIcon, Plus, ChevronRight, Bell } from "lucide-react";

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 text-white">
        <div className="relative isolate px-6 pt-14 lg:px-8">
          <div className="mx-auto max-w-2xl py-32 sm:py-48 lg:py-56 text-center">
            <h1 className="text-5xl font-extrabold tracking-tight sm:text-7xl bg-gradient-to-r from-orange-400 to-red-600 bg-clip-text text-transparent">
              Travel Together, Explore Further.
            </h1>
            <p className="mt-8 text-lg font-medium text-zinc-400 sm:text-xl">
              TripKarLo is the ultimate platform for group vehicle and travel enthusiasts. Create groups, plan routes, and explore the open road with your community.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <Link
                href="/register"
                className="rounded-xl bg-orange-600 px-6 py-3.5 text-lg font-semibold text-white shadow-xl hover:bg-orange-500 transition-all hover:scale-105 active:scale-95"
              >
                Join the Community
              </Link>
              <Link href="/login" className="text-lg font-semibold leading-6 text-white hover:text-orange-500 transition-colors">
                Log in <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  // Fetch data for logged in user
  let groups: any[] = [];
  let upcomingTrips: any[] = [];

  try {
    const [fetchedGroups, fetchedTrips] = await Promise.all([
      prisma.membership.findMany({
        where: { userId: user.id, status: "APPROVED" },
        include: { group: { include: { _count: { select: { memberships: true, trips: true } } } } },
        take: 4,
      }),
      prisma.trip.findMany({
        where: {
          isPublic: true,
          startTime: { gte: new Date() },
        },
        include: {
          group: { select: { name: true } },
          _count: { select: { rsvps: true } }
        },
        orderBy: { startTime: "asc" },
        take: 3,
      }),
    ]);
    groups = fetchedGroups;
    upcomingTrips = fetchedTrips;
  } catch (error: any) {
    console.error("[Home] Data fetch error:", error.message);
    // Return a fallback UI if data fetch fails instead of crashing
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Something went wrong</h1>
          <p className="text-zinc-400">We couldn't load your dashboard. Please try again later.</p>
          <pre className="mt-4 text-xs text-red-500">{error.message}</pre>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white">
      <div className="mx-auto max-w-5xl px-6 pt-12">
        <div className="flex items-center justify-between mb-12">
          <div>
            <h1 className="text-4xl font-black mb-2 tracking-tight">Welcome back, {user.name?.split(' ')[0] || 'Explorer'}!</h1>
            <p className="text-zinc-400">Ready for your next adventure?</p>
          </div>
          <div className="h-12 w-12 bg-zinc-900 rounded-2xl flex items-center justify-center ring-1 ring-zinc-800">
            <User className="h-6 w-6 text-zinc-400" />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Quick Stats/Actions */}
          <div className="md:col-span-2 space-y-8">
            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <Calendar className="text-orange-500 h-5 w-5" />
                  Upcoming Trips
                </h3>
                <Link href="/discovery" className="text-sm font-bold text-orange-500 hover:text-orange-400">Discover More</Link>
              </div>

              <div className="grid gap-4">
                {upcomingTrips.length === 0 ? (
                  <div className="p-12 text-center bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                    <p className="text-zinc-500">No upcoming trips found. Check back later!</p>
                  </div>
                ) : (
                  upcomingTrips.map((trip: any) => (
                    <Link
                      key={trip.id}
                      href={`/trips/${trip.id}`}
                      className="group relative overflow-hidden rounded-2xl bg-zinc-900 p-6 ring-1 ring-zinc-800 hover:ring-orange-500/50 transition-all cursor-pointer block"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="inline-flex items-center rounded-md bg-orange-500/10 px-2 py-1 text-[10px] font-black uppercase tracking-wider text-orange-500 ring-1 ring-inset ring-orange-500/20 mb-3">
                            {trip.isPublic ? "Public" : "Group Only"}
                          </span>
                          <h4 className="text-lg font-bold group-hover:text-orange-500 transition-colors uppercase tracking-tight">{trip.title}</h4>
                          <p className="text-zinc-400 text-sm mt-1 font-medium">{trip.meetingPoint}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-black text-white">{new Date(trip.startTime).toLocaleString('en-US', { month: 'short', day: 'numeric' }).toUpperCase()}</p>
                          <p className="text-[10px] text-zinc-500 font-bold">{new Date(trip.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                        </div>
                      </div>
                      <div className="mt-6 flex items-center justify-between">
                        <div className="flex items-center gap-4 text-[10px] font-black uppercase tracking-widest text-zinc-500">
                          <span className="flex items-center gap-1.5"><UsersIcon className="h-3.5 w-3.5 text-orange-600" /> {trip._count.rsvps} Participants</span>
                          <span className="flex items-center gap-1.5"><MapPin className="h-3.5 w-3.5 text-orange-600" /> {trip.group.name}</span>
                        </div>
                        <ChevronRight className="h-5 w-5 text-zinc-600 group-hover:text-orange-500 group-hover:translate-x-1 transition-all" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </section>

            <section>
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-xl font-semibold flex items-center gap-2">
                  <UsersIcon className="text-blue-500 h-5 w-5" />
                  My Groups
                </h3>
                <Link href="/groups/create" className="text-sm font-bold text-blue-500 hover:text-blue-400">Create New</Link>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {groups.length === 0 ? (
                  <div className="sm:col-span-2 p-12 text-center bg-zinc-900 rounded-3xl ring-1 ring-zinc-800">
                    <p className="text-zinc-500">You haven't joined any groups yet.</p>
                    <Link href="/groups/explore" className="text-orange-500 text-sm font-bold mt-2 inline-block hover:text-orange-400 transition-colors">Explore Groups</Link>
                  </div>
                ) : (
                  groups.map((membership: any) => (
                    <Link
                      key={membership.group.id}
                      href={`/groups/${membership.group.id}`}
                      className="rounded-2xl bg-zinc-900 p-5 ring-1 ring-zinc-800 hover:bg-zinc-800/50 transition-all cursor-pointer block group"
                    >
                      <h4 className="font-bold group-hover:text-blue-400 transition-colors uppercase tracking-tight">{membership.group.name}</h4>
                      <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mt-2">
                        {membership.group._count.memberships} members • {membership.group._count.trips} trips
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </section>
          </div>

          {/* Sidebar / Profile Settings */}
          <div className="space-y-6">
            <div className="rounded-3xl bg-zinc-900 p-8 ring-1 ring-zinc-800 shadow-2xl shadow-black/50">
              <h3 className="text-xl font-black mb-4">Complete Your Profile</h3>
              <p className="text-sm text-zinc-400 mb-8 leading-relaxed">Add your vehicle details and experience level to join group trips and connect with other enthusiasts.</p>
              <Link
                href="/profile"
                className="block w-full text-center rounded-2xl bg-zinc-800 px-4 py-4 text-sm font-black uppercase tracking-widest hover:bg-zinc-700 transition-all active:scale-95 shadow-lg"
              >
                Go to Profile
              </Link>
            </div>

            <div className="rounded-3xl bg-orange-600/5 p-8 ring-1 ring-orange-500/10 border-l-4 border-orange-500 overflow-hidden relative group">
              <div className="absolute top-0 right-0 -mr-8 -mt-8 h-32 w-32 bg-orange-500/10 rounded-full blur-3xl group-hover:bg-orange-500/20 transition-all duration-700"></div>
              <h3 className="font-black text-orange-500 mb-2 uppercase tracking-tight italic">Safe Travel Guide</h3>
              <p className="text-sm text-zinc-400 mb-6 leading-relaxed">Essential tips for group formation, signals, and open road safety.</p>
              <button className="text-xs font-black uppercase tracking-widest text-white bg-zinc-900 px-6 py-3 rounded-xl ring-1 ring-zinc-800 hover:bg-black transition-all shadow-xl active:scale-95">Read Guide</button>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
