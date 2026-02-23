import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import "dotenv/config";
import { nanoid } from "nanoid";

const url = "file:./dev.db"; // Matching what prisma db push used successfully
const client = createClient({ url });

async function run() {
    console.log("Direct SQL Seeding started...");

    try {
        // Clean up
        await client.execute("DELETE FROM Notification");
        await client.execute("DELETE FROM Message");
        await client.execute("DELETE FROM RSVP");
        await client.execute("DELETE FROM Ride");
        await client.execute("DELETE FROM Membership");
        await client.execute("DELETE FROM [Group]");
        await client.execute("DELETE FROM User");

        const adminId = nanoid();
        const rider1Id = nanoid();
        const rider2Id = nanoid();
        const hAdminPw = await bcrypt.hash("admin123", 10);
        const hRiderPw = await bcrypt.hash("password123", 10);

        // Users
        await client.execute({
            sql: "INSERT INTO User (id, email, password, name, role, ridingExperience, bikeTypes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [adminId, "admin@tripkarlo.com", hAdminPw, "Platform Admin", "PLATFORM_ADMIN", "Professional", "Road, Mountain, Gravel"]
        });

        await client.execute({
            sql: "INSERT INTO User (id, email, password, name, role, ridingExperience, bikeTypes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [rider1Id, "omar@example.com", hRiderPw, "Omar Altaf", "RIDER", "Advanced", "Road, Gravel"]
        });

        await client.execute({
            sql: "INSERT INTO User (id, email, password, name, role, ridingExperience, bikeTypes, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [rider2Id, "sarah@example.com", hRiderPw, "Sarah Rider", "RIDER", "Intermediate", "Mountain"]
        });

        const group1Id = nanoid();
        const group2Id = nanoid();

        // Groups
        await client.execute({
            sql: "INSERT INTO [Group] (id, name, description, joinPolicy, inviteCode, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [group1Id, "Alpine Explorers", "A community for high-altitude adventure seekers.", "REQUEST_ONLY", "ALPINE-EXP", adminId]
        });

        await client.execute({
            sql: "INSERT INTO [Group] (id, name, description, joinPolicy, inviteCode, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [group2Id, "Coastal Cruisers", "Easy-going rides along the beautiful coastline.", "OPEN", "COASTAL", rider1Id]
        });

        // Memberships
        await client.execute({
            sql: "INSERT INTO Membership (id, role, status, userId, groupId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "ADMIN", "APPROVED", adminId, group1Id]
        });
        await client.execute({
            sql: "INSERT INTO Membership (id, role, status, userId, groupId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "MEMBER", "APPROVED", rider1Id, group1Id]
        });
        await client.execute({
            sql: "INSERT INTO Membership (id, role, status, userId, groupId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "ADMIN", "APPROVED", rider1Id, group2Id]
        });

        // Rides
        const ride1Id = nanoid();
        const ride2Id = nanoid();
        await client.execute({
            sql: "INSERT INTO Ride (id, title, description, startTime, meetingPoint, terrainDifficulty, suitableBikes, riderCap, isPublic, groupId, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [ride1Id, "Black Forest Sunrise", "Epic morning climb.", datetimePlusHours(24), "Central Hub Fountain", "Challenging", "Road Bike", 15, 1, group1Id, adminId]
        });

        await client.execute({
            sql: "INSERT INTO Ride (id, title, description, startTime, meetingPoint, terrainDifficulty, suitableBikes, riderCap, isPublic, groupId, creatorId, createdAt, updatedAt) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [ride2Id, "Beach Road Coffee Run", "Chill 30km flat ride.", datetimePlusHours(168), "North Pier Entrance", "Easy", "Any", 25, 1, group2Id, rider1Id]
        });

        // RSVPs
        await client.execute({
            sql: "INSERT INTO RSVP (id, status, userId, rideId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "CONFIRMED", adminId, ride1Id]
        });
        await client.execute({
            sql: "INSERT INTO RSVP (id, status, userId, rideId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "CONFIRMED", rider1Id, ride1Id]
        });

        // Messages
        await client.execute({
            sql: "INSERT INTO Message (id, content, userId, rideId, createdAt, updatedAt) VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))",
            args: [nanoid(), "Looking forward to this! Don't forget your lights.", adminId, ride1Id]
        });

        console.log("Direct SQL Seeding completed successfully!");
    } catch (e) {
        console.error("Direct SQL Seeding failed:", e);
    } finally {
        client.close();
    }
}

function datetimePlusHours(h: number) {
    const d = new Date();
    d.setHours(d.getHours() + h);
    return d.toISOString();
}

run();
