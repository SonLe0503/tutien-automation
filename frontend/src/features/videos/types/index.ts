export interface Story {
  id: number;
  name: string;
  topic: string;
}

export interface Chapter {
  id: number;
  title: string;
  content: string;
  summary: string;
  sourceUrl: string;
  audioPath: string | null;
  videoPath: string | null;
  storyId: number;
  createdAt: string;
  story?: Story;
}
