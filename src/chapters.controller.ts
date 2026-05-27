import { Controller, Get, Post, Body, Patch, Param, Delete } from '@nestjs/common';
import { ChaptersService } from './chapters.service';
import { CreateChapterDto } from './dto/create-chapter.dto';
import { UpdateChapterDto } from './dto/update-chapter.dto';

@Controller('chapters')
export class ChaptersController {
  constructor(private readonly chaptersService: ChaptersService) {}

  @Post()
  create(@Body() createChapterDto: CreateChapterDto) {
    return this.chaptersService.create(createChapterDto);
  }

  @Get()
  findAll() {
    return this.chaptersService.findAll();
  }

  @Get('source-urls')
  findAllSourceUrls() {
    return this.chaptersService.findAllSourceUrls();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.chaptersService.findOne(+id);
  }

  @Post(':id/render')
  render(@Param('id') id: string, @Body() body: any) {
    return this.chaptersService.renderVideo(+id, body);
  }

  @Post(':id/send-audio')
  sendAudio(@Param('id') id: string) {
    return this.chaptersService.sendAudio(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() updateChapterDto: UpdateChapterDto) {
    return this.chaptersService.update(+id, updateChapterDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.chaptersService.remove(+id);
  }
}
