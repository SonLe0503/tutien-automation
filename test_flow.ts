import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { ChaptersService } from './src/chapters.service';

async function main() {
  console.log("[TestFlow] Bootstrapping NestJS application context...");
  const app = await NestFactory.createApplicationContext(AppModule);
  const chaptersService = app.get(ChaptersService);

  const payload = {
    title: "Bí quyết uống nước đúng cách",
    content: "Uống nước trước bữa ăn khoảng 30 phút giúp kích thích hệ tiêu hóa tốt hơn. Ngoài ra, việc này còn tạo cảm giác no giả giúp bạn nạp ít thức ăn hơn trong bữa chính, hỗ trợ quá trình giảm cân vô cùng hiệu quả.",
    summary: "Mẹo uống nước đúng cách trước bữa ăn giúp hỗ trợ tiêu hóa và giảm cân hiệu quả.",
    sourceUrl: "https://example.com/suc-khoe/uong-nuoc-dung-cach-2",
    storyId: 3
  };

  try {
    console.log("[TestFlow] Calling ChaptersService.create with HEALTH topic...");
    const result = await chaptersService.create(payload);
    console.log("[TestFlow] Success! Result details:", result);
  } catch (e) {
    console.error("[TestFlow] Execution failed:", e);
  } finally {
    await app.close();
  }
}

main();
