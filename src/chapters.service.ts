import { Injectable } from '@nestjs/common';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { PrismaService } from './prisma/prisma.service';
import { SummarizeService } from './summarize/summarize.service';
import { TelegramService } from './telegram/telegram.service';

@Injectable()
export class ChaptersService {
  constructor(
    private prisma: PrismaService,
    private summarizeService: SummarizeService,
    private telegramService: TelegramService,
  ) {}

  async create(createChapterDto: CreateChapterDto) {
    let { summary, content, title, sourceUrl } = createChapterDto;

    // 1. Tóm tắt bằng AI nếu cần
    if (!summary || summary === "Tóm tắt ngắn gọn...") {
      console.log('Generating summary using AI...');
      summary = await this.summarizeService.summarize(content);
    }

    // 2. Lưu vào Database
    const chapter = await this.prisma.chapter.upsert({
      where: { sourceUrl: createChapterDto.sourceUrl },
      update: {
        ...createChapterDto,
        summary,
      },
      create: {
        ...createChapterDto,
        summary,
      },
    });

    // 3. Gửi thông báo qua Telegram
    const telegramMessage = `
<b>📖 Chương mới: ${title}</b>

📝 <b>Tóm tắt:</b>
${summary}

🔗 <a href="${sourceUrl}">Đọc tại đây</a>
    `;
    await this.telegramService.sendMessage(telegramMessage);

    return chapter;
  }

  async findAll() {
    return this.prisma.chapter.findMany();
  }

  async findAllSourceUrls(): Promise<string[]> {
    const rows = await this.prisma.chapter.findMany({ select: { sourceUrl: true } });
    return rows.map((r) => r.sourceUrl);
  }

  async findOne(id: number) {
    return this.prisma.chapter.findUnique({
      where: { id },
    });
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    return this.prisma.chapter.update({
      where: { id },
      data: updateChapterDto,
    });
  }

  async remove(id: number) {
    return this.prisma.chapter.delete({
      where: { id },
    });
  }
}
