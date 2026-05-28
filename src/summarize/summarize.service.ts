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

  async autoBuildScenes(content: string): Promise<string> {
    try {
      console.log('[SummarizeService] Automatically splitting scenes and assigning illustrations with DeepSeek...');
      const completion = await this.openai.chat.completions.create({
        model: "deepseek-chat",
        messages: [
          {
            role: "system",
            content: `Bạn là trợ lý đạo diễn video sức khỏe chuyên nghiệp. Nhiệm vụ của bạn là nhận vào một đoạn kịch bản thô và tự động chia nó thành các phân cảnh ngắn (mỗi phân cảnh khoảng 1-2 câu ngắn gọn, cách nhau bởi đúng 2 dòng xuống hàng \n\n).
Với mỗi phân cảnh, bạn phải gán kèm một hình ảnh minh họa thích hợp bằng cách dán URL ảnh ngay trước nội dung phân cảnh theo cú pháp chính xác tuyệt đối như sau:
[image: URL_ANH]
Nội dung phân cảnh...

Bạn CHỈ ĐƯỢC CHỌN các URL ảnh từ danh sách dưới đây để đảm bảo link ảnh luôn hoạt động hoàn hảo:
- Thiền/Tĩnh lặng: https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800
- Salad/Ăn xanh: https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=800
- Rau củ tươi ngon: https://images.unsplash.com/photo-1490645935967-10de6ba17061?w=800
- Thể dục/Yoga: https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800
- Uống nước lọc: https://images.unsplash.com/photo-1548839130-3bfacc275cf5?w=800
- Nghỉ ngơi/Ngủ ngon: https://images.unsplash.com/photo-1511295742364-92767fa62d9f?w=800
- Chạy bộ nâng cao sức khỏe: https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?w=800
- Thảo mộc tự nhiên: https://images.unsplash.com/photo-1515003197210-e0cd71810b5f?w=800
- Thiên nhiên trong lành: https://images.unsplash.com/photo-1447752875215-b2761acb3c5d?w=800
- Trà xanh thanh nhiệt: https://images.unsplash.com/photo-1597481499750-3e6b22637e12?w=800

Ví dụ phản hồi mong muốn:
[image: https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800]
Thiền định mỗi sáng giúp bạn cân bằng tâm trí và giảm căng thẳng hiệu quả.

[image: https://images.unsplash.com/photo-1548839130-3bfacc275cf5?w=800]
Hãy bổ sung đủ hai lít nước mỗi ngày để cơ thể luôn tràn đầy năng lượng.

Chú ý: Chỉ trả về nội dung đã phân cảnh kèm tag ảnh theo cấu trúc trên, tuyệt đối không thêm lời chào hay giải thích nào khác.`
          },
          {
            role: "user",
            content: `Hãy tự động chia phân cảnh và gán ảnh cho kịch bản sau:\n\n${content}`
          }
        ]
      });

      return completion.choices[0].message.content ?? content;
    } catch (error) {
      console.error('Error auto building scenes with DeepSeek:', error);
      return content;
    }
  }
}
