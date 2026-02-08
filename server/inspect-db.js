const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function inspect() {
    try {
        const votes = await prisma.vote.findMany({
            orderBy: { castAt: 'desc' },
            take: 5
        });
        console.log("--- LATEST VOTES IN DB ---");
        console.log(JSON.stringify(votes, null, 2));
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

inspect();
