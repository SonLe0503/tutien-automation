import { Module } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { SummarizeModule } from './summarize/summarize.module';
import { TelegramModule } from './telegram/telegram.module';
import { TtsModule } from './tts/tts.module';
import { VideosModule } from './videos/videos.module';

@Module({
  imports: [SummarizeModule, TelegramModule, TtsModule, VideosModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
