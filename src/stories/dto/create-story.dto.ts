export class CreateStoryDto {
  name: string;
  slug: string;
  bookSlug: string;
  domain: string;
  indexUrl: string;
  tuaid?: string;
  priority?: number;
  active?: boolean;
}
