import { Module } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { ChaptersController } from './chapters.controller';
import { SummarizeModule } from './summarize/summarize.module';
import { TelegramModule } from './telegram/telegram.module';

@Module({
  imports: [SummarizeModule, TelegramModule],
  controllers: [ChaptersController],
  providers: [ChaptersService],
})
export class ChaptersModule {}
