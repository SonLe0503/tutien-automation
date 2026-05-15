import { Injectable } from '@nestjs/common';
import OpenAI from 'openai';

@Injectable()
export class SummarizeService {
  private openai: OpenAI;

  constructor() {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1',
    });
  }

  async summarize(content: string): Promise<string> {
    try {
      const completion = await this.openai.chat.completions.create({
        model: "deepseek-chat", // Tên model của DeepSeek
        messages: [
          {
            role: "system",
            content: "Bạn là một trợ lý tóm tắt nội dung truyện chuyên nghiệp. Hãy tóm tắt ngắn gọn nhưng đầy đủ các ý chính."
          },
          {
            role: "user",
            content: `Tóm tắt chương truyện này:\n\n${content}`,
          },
        ],
      });

      return completion.choices[0].message.content ?? 'Không có nội dung tóm tắt.';
    } catch (error) {
      console.error('Error summarizing with DeepSeek:', error);
      return 'Không thể tóm tắt nội dung tại thời điểm này.';
    }
  }
}
