import { prisma } from "../src/lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
    console.log("PostgreSQL Expanded Seeding started...");

    try {
        // Clean up
        console.log("Cleaning up database...");
        await prisma.notification.deleteMany();
        await prisma.message.deleteMany();
        await prisma.rSVP.deleteMany();
        await prisma.ride.deleteMany();
        await prisma.membership.deleteMany();
        await prisma.group.deleteMany();
        await prisma.user.deleteMany();

        const password = await bcrypt.hash("password123", 10);
        const adminPw = await bcrypt.hash("admin123", 10);

        // Create Platform Admin
        console.log("Creating platform admin...");
        await prisma.user.create({
            data: {
                email: "admin@tripkarlo.com",
                password: adminPw,
                name: "Platform Admin",
                role: "PLATFORM_ADMIN",
            }
        });

        // Create 25 users
        console.log("Creating 25 users...");
        const users = [];
        for (let i = 1; i <= 25; i++) {
            const user = await prisma.user.create({
                data: {
                    email: `user${i}@example.com`,
                    password: password,
                    name: `Participant ${i}`,
                    role: "PARTICIPANT",
                    vehicleExperience: i % 3 === 0 ? "Expert" : (i % 2 === 0 ? "Intermediate" : "Beginner"),
                    vehicleTypes: i % 2 === 0 ? "Road, Gravel, SUV" : "Mountain, Hybrid, 4x4",
                }
            });
            users.push(user);
        }

        // Define groups
        const groupData = [
            { name: "City Commuters", description: "Daily urban riders weaving through traffic.", joinPolicy: "PUBLIC" },
            { name: "Weekend Explorers", description: "Finding the best scenic routes every Saturday.", joinPolicy: "PUBLIC" },
            { name: "Road Warriors", description: "High-speed endurance focused group.", joinPolicy: "PUBLIC" },
            { name: "Midnight Cruisers", description: "Late night rides under the city lights.", joinPolicy: "PRIVATE" },
            { name: "Track Day Elite", description: "Professional-grade training and track sessions.", joinPolicy: "PRIVATE" },
        ];

        console.log("Creating groups and memberships...");
        for (let i = 0; i < groupData.length; i++) {
            const group = await prisma.group.create({
                data: {
                    name: groupData[i].name,
                    description: groupData[i].description,
                    joinPolicy: groupData[i].joinPolicy,
                    status: "APPROVED",
                    inviteCode: `JOIN-${groupData[i].name.replace(/\s+/g, '-').toUpperCase()}-${Math.random().toString(36).substring(2, 7).toUpperCase()}`,
                    creatorId: users[i].id,
                }
            });

            // Make the creator an admin
            await prisma.membership.create({
                data: {
                    userId: users[i].id,
                    groupId: group.id,
                    role: "ADMIN",
                }
            });

            // Add some random members to each group
            for (let j = 0; j < 5; j++) {
                const randomUserIndex = (i + j + 5) % users.length;
                if (randomUserIndex !== i) {
                    await prisma.membership.create({
                        data: {
                            userId: users[randomUserIndex].id,
                            groupId: group.id,
                            role: "MEMBER",
                        }
                    });
                }
            }

            // Create 3 rides for each group
            console.log(`Creating rides for ${group.name}...`);
            const rideTypes = ["Morning Trip", "Afternoon Trip", "Social Cruise"];
            for (let k = 0; k < 3; k++) {
                const startTime = new Date();
                startTime.setDate(startTime.getDate() + (k + 1));
                startTime.setHours(9 + k * 3, 0, 0, 0);

                const endTime = new Date(startTime);
                endTime.setHours(startTime.getHours() + 2);

                await prisma.ride.create({
                    data: {
                        title: `${group.name} - ${rideTypes[k]}`,
                        description: `A ${rideTypes[k].toLowerCase()} for the ${group.name} community.`,
                        startTime,
                        endTime,
                        meetingPoint: "Central Hub",
                        meetingPointUrl: "https://www.google.com/maps/search/?api=1&query=Central+Hub+London",
                        destination: "Scenic Lookout",
                        destinationUrl: "https://www.google.com/maps/search/?api=1&query=Scenic+Lookout",
                        terrainDifficulty: k === 0 ? "Easy" : (k === 1 ? "Medium" : "Hard"),
                        status: k === 0 ? "UPCOMING" : "UPCOMING",
                        groupId: group.id,
                        creatorId: users[i].id,
                    }
                });
            }
        }

        console.log("PostgreSQL Expanded Seeding completed successfully!");
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
}

main();
