export class CreateChapterDto {
  title: string;
  content: string;
  summary?: string;
  sourceUrl: string;
  storyId?: number;

  // Dynamic customization options
  voiceSpeed?: number;
  musicVolume?: number;
  accentColor?: string;
  fontFamily?: string;
  autoRender?: boolean;
}
