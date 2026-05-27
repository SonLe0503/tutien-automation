import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';
import { PrismaService } from './prisma/prisma.service';
import { SummarizeService } from './summarize/summarize.service';
import { TelegramService } from './telegram/telegram.service';
import { TtsService } from './tts/tts.service';
import { VideosService } from './videos/videos.service';

const AUDIO_DIR = path.join(process.cwd(), 'audio');

@Injectable()
export class ChaptersService {
  constructor(
    private prisma: PrismaService,
    private summarizeService: SummarizeService,
    private telegramService: TelegramService,
    private ttsService: TtsService,
    private videosService: VideosService,
  ) {
    fs.mkdirSync(AUDIO_DIR, { recursive: true });
  }

  async create(createChapterDto: CreateChapterDto) {
    let { summary, content, title, sourceUrl, storyId } = createChapterDto;

    // 1. Tóm tắt bằng AI nếu cần
    if (!summary || summary === 'Tóm tắt ngắn gọn...') {
      console.log('Generating summary using AI...');
      summary = await this.summarizeService.summarize(content);
    }

    // 2. Lưu vào Database (chỉ lưu các trường thuộc Database Schema)
    const chapter = await this.prisma.chapter.upsert({
      where: { sourceUrl: createChapterDto.sourceUrl },
      update: { title, content, summary, sourceUrl, storyId },
      create: { title, content, summary, sourceUrl, storyId },
    });

    // 2.5 Kiểm tra topic của Story
    const story = createChapterDto.storyId
      ? await this.prisma.story.findUnique({ where: { id: createChapterDto.storyId } })
      : null;
    const topic = (story as any)?.topic ?? 'TUTIEN';
    console.log(`[ChaptersService] Topic for chapter is: ${topic}`);

    // 3. TTS → lưu file MP3 (Đặt tên kèm theo chỉ số tốc độ để cache nhiều biến thể)
    const speed = createChapterDto.voiceSpeed !== undefined ? createChapterDto.voiceSpeed : 1.0;
    let audioPath: string | undefined = path.join(AUDIO_DIR, `${chapter.id}_speed_${speed}.mp3`);
    
    if (fs.existsSync(audioPath) && fs.statSync(audioPath).size > 1024) {
      console.log(`[ChaptersService] Existing audio file found at ${audioPath}, skipping TTS synthesis to save credits.`);
    } else {
      try {
        console.log(`Generating audio for chapter ${chapter.id} with speed ${speed}...`);
        const audioBuffer = await this.ttsService.synthesize(content, speed);
        fs.writeFileSync(audioPath, audioBuffer);

        await this.prisma.chapter.update({
          where: { id: chapter.id },
          data: { audioPath },
        });
      } catch (err) {
        console.error('TTS failed, skipping audio:', err.message);
        audioPath = undefined;
      }
    }

    // 4. Sinh Video và gửi Telegram nếu là topic HEALTH và autoRender = true
    if (topic === 'HEALTH' && audioPath && createChapterDto.autoRender) {
      let videoPath: string | undefined;
      try {
        console.log(`[ChaptersService] Topic is HEALTH and autoRender is enabled, generating video...`);
        videoPath = await this.videosService.generateShortVideo(chapter.id, title, content, audioPath, {
          musicVolume: createChapterDto.musicVolume,
          accentColor: createChapterDto.accentColor,
          fontFamily: createChapterDto.fontFamily
        });
        
        const updatedChapter = await this.prisma.chapter.update({
          where: { id: chapter.id },
          data: { videoPath } as any,
        });

        // Gửi video qua Telegram
        const caption = `<b>🌿 MẸO SỨC KHỎE: ${title}</b>\n\n📝 ${summary}\n\n🔗 <a href="${sourceUrl}">Đọc bài viết gốc</a>`;
        await this.telegramService.sendVideo(videoPath, caption);
        return updatedChapter;
      } catch (err) {
        console.error('[ChaptersService] Video generation failed, falling back to standard audio send:', err.message);
      }
    }

    // 5. Không tự động gửi Telegram - người dùng kích hoạt thủ công qua Frontend
    return chapter;
  }

  async findAll() {
    return this.prisma.chapter.findMany({
      include: { story: true },
    });
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

  async sendAudio(id: number) {
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { story: true },
    });
    if (!chapter) throw new Error(`Chapter with ID ${id} not found`);

    if (chapter.audioPath) {
      await this.telegramService.sendAudio(chapter.audioPath, chapter.title);
    } else {
      const msg = `<b>📖 ${chapter.title}</b>\n\n📝 ${chapter.summary}\n\n🔗 <a href="${chapter.sourceUrl}">Đọc tại đây</a>`;
      await this.telegramService.sendMessage(msg);
    }

    return { success: true, id: chapter.id };
  }

  async renderVideo(id: number, options: any = {}) {
    // 1. Fetch chapter from database
    const chapter = await this.prisma.chapter.findUnique({
      where: { id },
      include: { story: true },
    });
    if (!chapter) {
      throw new Error(`Chapter with ID ${id} not found`);
    }

    const topic = (chapter.story as any)?.topic ?? 'TUTIEN';
    if (topic !== 'HEALTH') {
      throw new Error(`Only chapters with HEALTH topic can be rendered into video`);
    }

    // 2. Synthesize audio if not already existing
    const speed = options.voiceSpeed !== undefined ? options.voiceSpeed : 1.0;
    let audioPath = chapter.audioPath;
    if (!audioPath || !fs.existsSync(audioPath) || fs.statSync(audioPath).size <= 1024) {
      console.log(`[ChaptersService] Synthesizing audio for manual video rendering...`);
      const audioDir = path.join(process.cwd(), 'audio');
      audioPath = path.join(audioDir, `${chapter.id}_speed_${speed}.mp3`);
      const audioBuffer = await this.ttsService.synthesize(chapter.content, speed);
      fs.writeFileSync(audioPath, audioBuffer);
      
      await this.prisma.chapter.update({
        where: { id: chapter.id },
        data: { audioPath },
      });
    }

    // 3. Render video
    console.log(`[ChaptersService] Running on-demand video rendering for chapter ${chapter.id}...`);
    const videoPath = await this.videosService.generateShortVideo(
      chapter.id,
      chapter.title,
      chapter.content,
      audioPath,
      {
        musicVolume: options.musicVolume,
        accentColor: options.accentColor,
        fontFamily: options.fontFamily,
      },
    );

    // 4. Update videoPath in DB
    const updatedChapter = await this.prisma.chapter.update({
      where: { id: chapter.id },
      data: { videoPath } as any,
    });

    // 5. Send to Telegram
    const caption = `<b>🌿 MẸO SỨC KHỎE: ${chapter.title}</b>\n\n📝 ${chapter.summary}\n\n🔗 <a href="${chapter.sourceUrl}">Đọc bài viết gốc</a>`;
    await this.telegramService.sendVideo(videoPath, caption);

    return updatedChapter;
  }
}
