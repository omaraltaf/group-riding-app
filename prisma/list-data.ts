import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

const connectionString = process.env.DATABASE_URL;
const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function list() {
    try {
        const userCount = await prisma.user.count();
        const groupCount = await prisma.group.count();
        const tripCount = await prisma.trip.count();

        console.log(`Summary: Users: ${userCount}, Groups: ${groupCount}, Trips: ${tripCount}`);

        const groups = await prisma.group.findMany();
        console.log("\nGroups found:");
        groups.forEach(g => console.log(`- ${g.name} (${g.id})`));

        const targetGroups = groups.filter(g =>
            g.name.toLowerCase().includes("weekend riders") ||
            g.name.toLowerCase().includes("road rebels") ||
            g.name.toLowerCase().includes("delete")
        );

        if (targetGroups.length > 0) {
            console.log("\n✅ Found target groups reported by user!");
            targetGroups.forEach(g => console.log(`- MATCH: ${g.name}`));
        } else {
            console.log("\n❌ Did NOT find group names reported by user in this list.");
        }

        const specificUser = await prisma.user.findUnique({
            where: { email: "omaraltaf@gmail.com" }
        });

        if (specificUser) {
            console.log(`\n✅ Found user omaraltaf@gmail.com! (Name: ${specificUser.name})`);
        } else {
            console.log("\n❌ Did NOT find user omaraltaf@gmail.com.");
        }

    } catch (err) {
        console.error("Error listing data:", err);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

list();
