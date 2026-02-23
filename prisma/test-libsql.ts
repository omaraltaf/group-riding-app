import { createClient } from "@libsql/client";
import "dotenv/config";

console.log("TEST DATABASE_URL:", process.env.DATABASE_URL);
const url = process.env.DATABASE_URL || "file:./dev.db";
console.log("Using URL:", url);

try {
    const client = createClient({ url });
    console.log("Client created successfully");
} catch (e) {
    console.error("Client creation failed:", e);
}
