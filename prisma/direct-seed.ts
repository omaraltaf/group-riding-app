import postgres from "postgres";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { nanoid } from "nanoid";

const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
if (!url) {
    throw new Error("DATABASE_URL is not defined in environment variables");
}

const sql = postgres(url, { ssl: "require" });

async function run() {
    console.log("Direct SQL Seeding started (PostgreSQL with postgres.js)...");

    try {
        // Clean up - Note: Order matters for foreign keys
        console.log("Cleaning up existing data...");
        await sql`DELETE FROM "Notification"`;
        await sql`DELETE FROM "Message"`;
        await sql`DELETE FROM "RSVP"`;
        await sql`DELETE FROM "Ride"`;
        await sql`DELETE FROM "Membership"`;
        await sql`DELETE FROM "Group"`;
        await sql`DELETE FROM "User"`;

        const adminId = nanoid();
        const member1Id = nanoid();
        const member2Id = nanoid();
        const hAdminPw = await bcrypt.hash("admin123", 10);
        const hMemberPw = await bcrypt.hash("password123", 10);

        // Users
        console.log("Inserting users...");
        await sql`
            INSERT INTO "User" (id, email, password, name, role, "vehicleExperience", "vehicleTypes", "createdAt", "updatedAt") 
            VALUES (${adminId}, 'admin@tripkarlo.com', ${hAdminPw}, 'Platform Admin', 'PLATFORM_ADMIN', 'Professional', 'Bikes, Cars, SUVs, 4x4s', NOW(), NOW())
        `;

        await sql`
            INSERT INTO "User" (id, email, password, name, role, "vehicleExperience", "vehicleTypes", "createdAt", "updatedAt") 
            VALUES (${member1Id}, 'omar@example.com', ${hMemberPw}, 'Omar Altaf', 'PARTICIPANT', 'Advanced', 'SUV, 4x4', NOW(), NOW())
        `;

        await sql`
            INSERT INTO "User" (id, email, password, name, role, "vehicleExperience", "vehicleTypes", "createdAt", "updatedAt") 
            VALUES (${member2Id}, 'sarah@example.com', ${hMemberPw}, 'Sarah Explorer', 'PARTICIPANT', 'Intermediate', 'Motorcycle', NOW(), NOW())
        `;

        const group1Id = nanoid();
        const group2Id = nanoid();

        // Groups
        console.log("Inserting groups...");
        await sql`
            INSERT INTO "Group" (id, name, description, "joinPolicy", "inviteCode", "creatorId", "createdAt", "updatedAt") 
            VALUES (${group1Id}, 'Alpine Explorers', 'A community for high-altitude adventure seekers (4x4s & Bikes).', 'REQUEST_ONLY', 'ALPINE-EXP', ${adminId}, NOW(), NOW())
        `;

        await sql`
            INSERT INTO "Group" (id, name, description, "joinPolicy", "inviteCode", "creatorId", "createdAt", "updatedAt") 
            VALUES (${group2Id}, 'Coastal Cruisers', 'Easy-going trips along the beautiful coastline.', 'OPEN', 'COASTAL', ${member1Id}, NOW(), NOW())
        `;

        // Memberships
        console.log("Inserting memberships...");
        await sql`INSERT INTO "Membership" (id, role, status, "userId", "groupId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'ADMIN', 'APPROVED', ${adminId}, ${group1Id}, NOW(), NOW())`;
        await sql`INSERT INTO "Membership" (id, role, status, "userId", "groupId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'MEMBER', 'APPROVED', ${member1Id}, ${group1Id}, NOW(), NOW())`;
        await sql`INSERT INTO "Membership" (id, role, status, "userId", "groupId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'ADMIN', 'APPROVED', ${member1Id}, ${group2Id}, NOW(), NOW())`;

        // Rides
        console.log("Inserting trips...");
        const ride1Id = nanoid();
        const ride2Id = nanoid();
        await sql`
            INSERT INTO "Ride" (id, title, description, "startTime", "meetingPoint", "terrainDifficulty", "suitableVehicles", "participantCap", "isPublic", "groupId", "creatorId", "createdAt", "updatedAt") 
            VALUES (${ride1Id}, 'Black Forest Sunrise', 'Epic morning climb for all vehicle types.', ${new Date(Date.now() + 24 * 3600 * 1000)}, 'Central Hub Fountain', 'Challenging', 'Any', 15, true, ${group1Id}, ${adminId}, NOW(), NOW())
        `;

        await sql`
            INSERT INTO "Ride" (id, title, description, "startTime", "meetingPoint", "terrainDifficulty", "suitableVehicles", "participantCap", "isPublic", "groupId", "creatorId", "createdAt", "updatedAt") 
            VALUES (${ride2Id}, 'Beach Road Coffee Run', 'Chill 30km flat drive. Suitable for Sedans.', ${new Date(Date.now() + 168 * 3600 * 1000)}, 'North Pier Entrance', 'Easy', 'Cars, SUVs', 25, true, ${group2Id}, ${member1Id}, NOW(), NOW())
        `;

        // RSVPs
        console.log("Inserting RSVPs...");
        await sql`INSERT INTO "RSVP" (id, status, "userId", "rideId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'CONFIRMED', ${adminId}, ${ride1Id}, NOW(), NOW())`;
        await sql`INSERT INTO "RSVP" (id, status, "userId", "rideId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'CONFIRMED', ${member1Id}, ${ride1Id}, NOW(), NOW())`;

        // Messages
        console.log("Inserting messages...");
        await sql`INSERT INTO "Message" (id, content, "userId", "rideId", "createdAt", "updatedAt") VALUES (${nanoid()}, 'Looking forward to this! Don''t forget your gear.', ${adminId}, ${ride1Id}, NOW(), NOW())`;

        console.log("Direct SQL Seeding completed successfully!");
    } catch (e) {
        console.error("Direct SQL Seeding failed:", e);
    } finally {
        await sql.end();
    }
}

run();
