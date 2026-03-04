/**
 * Utility to provide the correct database URL based on the current Git branch.
 * This ensures feature branches use isolated development databases.
 */
export function getConfiguredDatabaseUrl(rawUrl: string | undefined): string | undefined {
    if (!rawUrl) return undefined;

    const currentBranch = process.env.VERCEL_GIT_COMMIT_REF || process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_REF;

    // List of branches that should use the development database (ep-long-leaf)
    const devBranches = [
        'feature/vehicle-agnostic-v2',
        'update-vehicle-type',
        'feature/trip-categories'
    ];

    let url = rawUrl;

    if (currentBranch && devBranches.includes(currentBranch)) {
        // Replace the Neon host prefix (ep-*) with the development database host
        url = url.replace(/ep-[^.]+/, 'ep-long-leaf-aisgx9c1');
    }

    // For migration scripts: automatically derive direct URL from pooled URL if needed
    if (!process.env.DIRECT_URL && url.includes("-pooler")) {
        url = url.replace("-pooler", "");
    }

    return url;
}
