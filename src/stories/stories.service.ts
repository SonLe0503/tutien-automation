import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStoryDto } from './dto/create-story.dto';

@Injectable()
export class StoriesService {
  constructor(private prisma: PrismaService) {}

  create(dto: CreateStoryDto) {
    return this.prisma.story.create({ data: dto });
  }

  findAll() {
    return this.prisma.story.findMany({ orderBy: { createdAt: 'desc' } });
  }

  findActive() {
    return this.prisma.story.findMany({ where: { active: true } });
  }

  findOne(id: number) {
    return this.prisma.story.findUnique({ where: { id } });
  }

  update(id: number, data: object) {
    return this.prisma.story.update({ where: { id }, data });
  }

  setActive(id: number, active: boolean) {
    return this.prisma.story.update({ where: { id }, data: { active } });
  }

  remove(id: number) {
    return this.prisma.story.delete({ where: { id } });
  }
}
