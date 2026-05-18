import { Controller, Get, Post, Delete, Patch, Param, Body } from '@nestjs/common';
import { StoriesService } from './stories.service';
import { CreateStoryDto } from './dto/create-story.dto';

@Controller('stories')
export class StoriesController {
  constructor(private readonly storiesService: StoriesService) {}

  @Post()
  create(@Body() dto: CreateStoryDto) {
    return this.storiesService.create(dto);
  }

  @Get()
  findAll() {
    return this.storiesService.findAll();
  }

  @Get('active')
  findActive() {
    return this.storiesService.findActive();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.storiesService.findOne(+id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: Partial<CreateStoryDto>) {
    return this.storiesService.update(+id, dto);
  }

  @Patch(':id/activate')
  activate(@Param('id') id: string) {
    return this.storiesService.setActive(+id, true);
  }

  @Patch(':id/deactivate')
  deactivate(@Param('id') id: string) {
    return this.storiesService.setActive(+id, false);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.storiesService.remove(+id);
  }
}
