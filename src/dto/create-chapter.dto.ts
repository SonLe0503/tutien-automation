export class CreateChapterDto {
  title: string;
  content: string;
  summary?: string;
  sourceUrl: string;
  storyId?: number;
}
