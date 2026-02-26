import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const TARGET_GROUPS = [
    "Group to delete",
    "City Commuters",
    "Weekend Explorers",
    "Road Warriors",
    "Midnight Cruisers",
    "Track Day Elite"
];

async function cleanup() {
    const url = process.env.DATABASE_URL;
    if (!url) {
        console.error("DATABASE_URL is not set");
        process.exit(1);
    }

    console.log(`🧹 Starting cleanup on host: ${url.split('@')[1] || url}`);

    const pool = new pg.Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        console.log("\nSearching for groups to delete...");

        const groupsToDelete = await prisma.group.findMany({
            where: {
                name: {
                    in: TARGET_GROUPS
                }
            },
            include: {
                _count: {
                    select: {
                        rides: true,
                        memberships: true
                    }
                }
            }
        });

        if (groupsToDelete.length === 0) {
            console.log("No matching groups found. Cleanup already complete?");
            return;
        }

        console.log(`Found ${groupsToDelete.length} groups to remove:`);
        for (const g of groupsToDelete) {
            console.log(`- ${g.name} (${g.id}): ${g._count.rides} rides, ${g._count.memberships} memberships`);
        }

        console.log("\nExecuting deletion...");

        // Deleting the group will trigger cascading deletes for memberships and rides
        const deleteResult = await prisma.group.deleteMany({
            where: {
                id: {
                    in: groupsToDelete.map(g => g.id)
                }
            }
        });

        console.log(`✅ Successfully deleted ${deleteResult.count} groups.`);
        console.log("Cascading deletes should have removed all associated rides, memberships, RSVPs, and messages.");

    } catch (err) {
        console.error("❌ Cleanup failed:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

cleanup();
