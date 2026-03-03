const { execSync } = require('child_process');
const { URL } = require('url');

function getDatabaseUrl() {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return null;

    // Feature branch database switching
    if (process.env.VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'feature/vehicle-agnostic-v2' ||
        process.env.VERCEL_GIT_COMMIT_REF === 'update-vehicle-type' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'update-vehicle-type') {
        url = url.replace(/ep-[^.]+/, 'ep-long-leaf-aisgx9c1');
    }

    // 1. Derivation: Handle Neon pooled URLs
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");
    }

    // 2. Force parameters
    try {
        const urlObj = new URL(url);
        urlObj.searchParams.set("pgbouncer", "true");
        urlObj.searchParams.set("connect_timeout", "60");
        return urlObj.toString();
    } catch (e) {
        return url;
    }
}

const migrationUrl = getDatabaseUrl();

if (!migrationUrl) {
    console.error("❌ No database URL found for migration.");
    process.exit(1);
}

console.log(`🚀 Starting migration on host: ${new URL(migrationUrl).hostname}`);
console.log(`🔗 Connection params: pgbouncer=${new URL(migrationUrl).searchParams.get("pgbouncer")}, timeout=${new URL(migrationUrl).searchParams.get("connect_timeout")}`);

try {
    // Skip migration deploy if on update-vehicle-type branch as it's manually refactored
    if (process.env.VERCEL_GIT_COMMIT_REF === 'update-vehicle-type' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'update-vehicle-type') {
        console.log("⏩ Skipping migration deploy for update-vehicle-type branch (manually refactored).");
    } else {
        // Run migration with the forced URL
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: {
                ...process.env,
                DATABASE_URL: migrationUrl
            }
        });
        console.log("✅ Migration completed successfully.");
    }
} catch (error) {
    console.error("❌ Migration failed.");
    process.exit(1);
}
