import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { PrismaService } from './prisma/prisma.service';
import { SummarizeService } from './summarize/summarize.service';
import { TelegramService } from './telegram/telegram.service';
import { TtsService } from './tts/tts.service';

const AUDIO_DIR = path.join(process.cwd(), 'audio');

@Injectable()
export class ChaptersService {
  constructor(
    private prisma: PrismaService,
    private summarizeService: SummarizeService,
    private telegramService: TelegramService,
    private ttsService: TtsService,
  ) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  async create(createChapterDto: CreateChapterDto) {
    let { summary, content, title, sourceUrl } = createChapterDto;

    // 1. Tóm tắt bằng AI nếu cần
    if (!summary || summary === 'Tóm tắt ngắn gọn...') {
      console.log('Generating summary using AI...');
      summary = await this.summarizeService.summarize(content);
    }

    // 2. Lưu vào Database
    const chapter = await this.prisma.chapter.upsert({
      where: { sourceUrl: createChapterDto.sourceUrl },
      update: { ...createChapterDto, summary },
      create: { ...createChapterDto, summary },
    });

    // 3. TTS → lưu file MP3
    let audioPath: string | undefined;
    try {
      console.log(`Generating audio for chapter ${chapter.id}...`);
      const audioBuffer = await this.ttsService.synthesize(content);
      audioPath = path.join(AUDIO_DIR, `${chapter.id}.mp3`);
      fs.writeFileSync(audioPath, audioBuffer);

      await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: { audioPath },
      });
    } catch (err) {
      console.error('TTS failed, skipping audio:', err.message);
    }

    // 4. Gửi thông báo qua Telegram
    if (audioPath) {
      await this.telegramService.sendAudio(audioPath, title);
    } else {
      const msg = `<b>📖 ${title}</b>\n\n📝 ${summary}\n\n🔗 <a href="${sourceUrl}">Đọc tại đây</a>`;
      await this.telegramService.sendMessage(msg);
    }

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
    return this.prisma.chapter.findUnique({ where: { id } });
  }

  async update(id: number, updateChapterDto: UpdateChapterDto) {
    return this.prisma.chapter.update({ where: { id }, data: updateChapterDto });
  }

  async remove(id: number) {
    return this.prisma.chapter.delete({ where: { id } });
  }
}
