// Prisma Client configuration with Accelerate extension
import { PrismaClient } from '@prisma/client/edge';
import { withAccelerate } from '@prisma/extension-accelerate';

// Create Prisma client with Accelerate extension for enhanced performance
// Use environment variable or throw descriptive error
const databaseUrl = process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error('DATABASE_URL environment variable is not set');
}

const prisma = new PrismaClient({
  datasourceUrl: databaseUrl,
}).$extends(withAccelerate());

export { prisma };
