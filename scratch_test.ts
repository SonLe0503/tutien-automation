import { PrismaClient } from '@prisma/client';

async function main() {
  const prisma = new PrismaClient({
    datasourceUrl: "postgresql://admin:123456@localhost:5433/tutien?schema=public"
  } as any);
  try {
    await prisma.$connect();
    console.log("Connected successfully to DB");
    
    // Create the HEALTH story
    const story = await prisma.story.upsert({
      where: { slug: "suc-khoe-chu-dong" },
      update: { topic: "HEALTH" } as any,
      create: {
        name: "Sức Khỏe Chủ Động",
        slug: "suc-khoe-chu-dong",
        bookSlug: "health-tips",
        domain: "vietnamthuquan",
        indexUrl: "http://vietnamthuquan.eu/truyen/suc-khoe",
        topic: "HEALTH",
        active: true
      } as any
    });
    console.log("HEALTH Story upserted successfully:", story);

    // Update chapter 101 videoPath to null so we can see and test the "Tạo Video & Gửi Tele" button
    const updated = await prisma.chapter.update({
      where: { id: 101 },
      data: { videoPath: null } as any
    });
    console.log("Updated chapter 101 videoPath to null:", updated);

  } catch (e) {
    console.error("Operation failed", e);
  } finally {
    await prisma.$disconnect();
  }
}

main();

