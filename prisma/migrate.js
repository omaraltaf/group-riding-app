const { execSync } = require('child_process');
const { URL } = require('url');

/**
 * Migration helper for Vercel build phase.
 * Handles database host replacement for feature branches.
 */
function getDatabaseUrl() {
    let url = process.env.DIRECT_URL || process.env.DATABASE_URL;
    if (!url) return null;

    const currentBranch = process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;

    // Feature branch database switching
    const devBranches = [
        'feature/vehicle-agnostic-v2',
        'update-vehicle-type',
        'feature/trip-categories'
    ];

    if (currentBranch && devBranches.includes(currentBranch)) {
        // Use development database host, preserving -pooler suffix if present
        url = url.replace(/ep-[a-z0-9-]+?(?=-pooler\.|\.|$)/, 'ep-icy-darkness-aie1t3lq');
    }

    // Handle Neon pooled URLs by deriving direct connection
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");
    }

    // Force pgbouncer and timeout parameters for stability during build
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

const currentHost = new URL(migrationUrl).hostname;
console.log(`🚀 Starting migration on host: ${currentHost}`);

try {
    const isRefactorBranch = process.env.VERCEL_GIT_COMMIT_REF === 'update-vehicle-type' ||
        process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF === 'update-vehicle-type';

    if (isRefactorBranch) {
        console.log("⏩ Skipping Prisma Migrate Deploy (Schema managed manually for refactor).");
    } else {
        execSync('npx prisma migrate deploy', {
            stdio: 'inherit',
            env: { ...process.env, DATABASE_URL: migrationUrl }
        });
        console.log("✅ Migration completed successfully.");
    }
} catch (error) {
    console.error("❌ Migration failed.");
    process.exit(1);
}
