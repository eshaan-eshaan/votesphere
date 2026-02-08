const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function check() {
    try {
        const count = await prisma.admin.count();
        console.log(`Admin Count: ${count}`);

        if (count > 0) {
            const admin = await prisma.admin.findFirst();
            console.log(`First Admin Email: ${admin.email}`);
        }
    } catch (e) {
        console.error(e);
    } finally {
        await prisma.$disconnect();
    }
}

check();
