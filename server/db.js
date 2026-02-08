const { PrismaClient } = require("@prisma/client");

// Ensure environment variables are loaded
if (!process.env.DATABASE_URL) {
    require("dotenv").config();
}

const prisma = global.prisma || new PrismaClient();

if (process.env.NODE_ENV !== "production") {
    global.prisma = prisma;
}

module.exports = prisma;
