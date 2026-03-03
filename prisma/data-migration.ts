import postgres from "postgres";
import "dotenv/config";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const sql = postgres(url, { ssl: "require" });

async function run() {
    console.log("Internal Data Migration started (PostgreSQL)...");

    try {
        // Step 1: Syncing Users
        console.log("Copying data in 'User' table...");
        await sql`
            UPDATE "User" 
            SET "vehicleExperience" = "ridingExperience", 
                "vehicleTypes" = "bikeTypes"
            WHERE "vehicleExperience" IS NULL;
        `;

        // Step 2: Syncing Rides
        console.log("Copying data in 'Ride' table...");
        await sql`
            UPDATE "Ride" 
            SET "suitableVehicles" = "suitableBikes", 
                "participantCap" = "riderCap"
            WHERE "suitableVehicles" IS NULL;
        `;

        // Step 3: Syncing FKs for RSVP
        console.log("Copying data in 'RSVP' table...");
        await sql`
            UPDATE "RSVP" 
            SET "tripId" = "rideId"
            WHERE "tripId" IS NULL;
        `;

        // Step 4: Syncing FKs for Message
        console.log("Copying data in 'Message' table...");
        await sql`
            UPDATE "Message" 
            SET "tripId" = "rideId"
            WHERE "tripId" IS NULL;
        `;

        console.log("Internal Data Migration completed successfully!");
    } catch (e) {
        console.error("Internal Data Migration failed:", e);
    } finally {
        await sql.end();
    }
}

run();
