
const { PrismaClient } = require('@prisma/client')

const prisma = new PrismaClient()

async function main() {
    try {
        const count = await prisma.sale.count()
        console.log(`Total Sales in DB: ${count}`)

        if (count > 0) {
            const sample = await prisma.sale.findFirst()
            console.log("Sample:", sample)
        }
    } catch (e) {
        console.error(e)
    } finally {
        await prisma.$disconnect()
    }
}

main()
