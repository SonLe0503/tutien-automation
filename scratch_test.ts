import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasourceUrl: "postgresql://admin:123456@localhost:5433/tutien?schema=public"
  } as any);
  try {
    await prisma.$connect();
    console.log("Connected successfully");
    const count = await prisma.chapter.count();
    console.log("Chapter count:", count);
  } catch (e) {
    console.error("Connection failed", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();
