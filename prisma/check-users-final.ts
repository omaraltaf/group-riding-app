import { PrismaClient } from '@prisma/client'
import { PrismaPg } from '@prisma/adapter-pg'
import pg from 'pg'

const connectionString = process.env.DATABASE_URL
const pool = new pg.Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

async function main() {
    const users = await prisma.user.findMany({
        select: {
            email: true,
            name: true,
            role: true
        }
    })
    console.log('USERS_START')
    console.log(JSON.stringify(users, null, 2))
    console.log('USERS_END')
}

main()
    .catch(e => console.error(e))
    .finally(async () => await prisma.$disconnect())
