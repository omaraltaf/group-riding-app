import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";
import "dotenv/config";

async function listForUrl(url: string, label: string) {
    console.log(`\n--- Checking ${label} ---`);
    console.log(`URL: ${url.split('@')[1] || url}`);

    const pool = new pg.Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
        const userCount = await prisma.user.count();
        const groupCount = await prisma.group.count();
        const rideCount = await prisma.ride.count();

        console.log(`Summary: Users: ${userCount}, Groups: ${groupCount}, Rides: ${rideCount}`);

        const groups = await prisma.group.findMany({ take: 5 });
        groups.forEach(g => console.log(`- Group: ${g.name}`));

        const rides = await prisma.ride.findMany({ take: 5 });
        rides.forEach(r => console.log(`- Ride: ${r.title}`));

    } catch (err: any) {
        console.error(`Error: ${err.message}`);
    } finally {
        await prisma.$disconnect();
        await pool.end();
    }
}

async function run() {
    const urls = [
        { url: process.env.DATABASE_URL, label: "DATABASE_URL" },
        { url: process.env.DATABASE_URL_UNPOOLED, label: "DATABASE_URL_UNPOOLED" },
        { url: process.env.POSTGRES_URL, label: "POSTGRES_URL" },
        { url: process.env.POSTGRES_PRISMA_URL, label: "POSTGRES_PRISMA_URL" },
        { url: process.env.OLD_DATABASE_URL, label: "OLD_DATABASE_URL" },
    ];

    for (const item of urls) {
        if (item.url) {
            await listForUrl(item.url, item.label);
        }
    }
}

run();
