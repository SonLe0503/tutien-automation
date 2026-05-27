import React, { useState } from 'react';
import { Input, Select, Button } from 'antd';
import type { Story } from '@/features/videos/types';
import { StudioConfigPanel } from '@/features/videos/components/StudioConfigPanel';

interface VideoStudioProps {
  stories: Story[];
  onSubmit: (payload: any) => Promise<void>;
  loading: boolean;
  loadingStep: string;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ stories, onSubmit, loading, loadingStep }) => {
  const [selectedStoryId, setSelectedStoryId] = useState<number>(3); // Fallback to Health story (3)
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [summary, setSummary] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Custom Styling / Audio Settings State
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.12);
  const [accentColor, setAccentColor] = useState<string>('emerald');
  const [fontFamily, setFontFamily] = useState<string>('sans');

  const currentStoryTopic = stories.find(s => s.id === Number(selectedStoryId))?.topic ?? 'TUTIEN';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      alert('Vui lòng điền đầy đủ Tiêu đề và Nội dung!');
      return;
    }

    const payload = {
      title,
      content,
      summary: summary || 'Tóm tắt ngắn gọn...',
      sourceUrl: sourceUrl || `https://example.com/suc-khoe/generated-${Date.now()}`,
      storyId: Number(selectedStoryId),
      voiceSpeed,
      musicVolume,
      accentColor,
      fontFamily
    };

    onSubmit(payload).then(() => {
      // Clear form on success
      setTitle('');
      setContent('');
      setSummary('');
      setSourceUrl('');
    });
  };

  return (
    <section className="bg-dark-card border border-dark-border backdrop-blur-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative overflow-hidden">
      <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/5 rounded-full filter blur-3xl pointer-events-none"></div>

      <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
        <span>✍️</span> Biên Soạn Kịch Bản AI
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Story/Topic Selector */}
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Chủ đề & Thể loại</label>
          <Select
            value={selectedStoryId}
            onChange={(val) => setSelectedStoryId(val)}
            className="w-full !bg-transparent text-white [&>.ant-select-selector]:!bg-black/40 [&>.ant-select-selector]:!border-dark-border [&>.ant-select-selector]:!text-white [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!py-1.5 focus:!border-emerald-500"
            popupClassName="!bg-[#0f1412] !border !border-white/10 [&_.ant-select-item]:!text-gray-300 [&_.ant-select-item-option-selected]:!bg-emerald-500/20 [&_.ant-select-item-option-active]:!bg-white/5 hover:[&_.ant-select-item]:!text-white"
          >
            {stories.map((story) => (
              <Select.Option key={story.id} value={story.id}>
                {story.name} ({story.topic === 'HEALTH' ? 'HEALTH - Video 9:16' : 'TUTIEN - Audio MP3'})
              </Select.Option>
            ))}
          </Select>
        </div>

        {/* Input Title */}
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Tiêu đề bài viết / Chương</label>
          <Input
            placeholder="Ví dụ: Bí quyết uống nước đúng cách giúp giảm mỡ thừa"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full !bg-black/40 !border-dark-border !text-white !px-4 !py-3 !rounded-xl focus:!outline-none focus:!border-emerald-500 transition duration-200 placeholder:!text-gray-600"
          />
        </div>

        {/* Input Content */}
        <div>
          <label className="block text-gray-400 text-sm font-bold mb-2">Nội dung chi tiết (Đọc thành Video/Giọng nói)</label>
          <Input.TextArea
            rows={5}
            placeholder="Nhập đoạn kịch bản ngắn dưới 150 từ..."
            value={content}
            onChange={(e) => setContent(e.target.value)}
            required
            className="w-full !bg-black/40 !border-dark-border !text-white !px-4 !py-3 !rounded-xl focus:!outline-none focus:!border-emerald-500 transition duration-200 placeholder:!text-gray-600 !resize-none"
          />
        </div>

        {/* AI CONFIGURATION SETTINGS PANEL */}
        <StudioConfigPanel
          currentStoryTopic={currentStoryTopic}
          voiceSpeed={voiceSpeed}
          setVoiceSpeed={setVoiceSpeed}
          musicVolume={musicVolume}
          setMusicVolume={setMusicVolume}
          accentColor={accentColor}
          setAccentColor={setAccentColor}
          fontFamily={fontFamily}
          setFontFamily={setFontFamily}
        />

        {/* BUTTON CREATE / LOADING SPIN */}
        <Button
          type="primary"
          htmlType="submit"
          loading={loading}
          className={`w-full !py-6 !px-6 !rounded-2xl font-extrabold !text-lg !text-black transition-all duration-300 transform hover:scale-[1.02] active:scale-95 !border-0 !h-auto flex items-center justify-center ${
            loading
              ? '!bg-gray-800 !text-gray-500 cursor-not-allowed border border-white/5'
              : currentStoryTopic === 'HEALTH'
                ? '!bg-gradient-to-r !from-[#10B981] !to-[#34D399] hover:!from-[#34D399] hover:!to-[#10B981] hover:!shadow-[0_0_30px_rgba(16,185,129,0.35)]'
                : '!bg-gradient-to-r !from-amber-500 !to-yellow-400 hover:!from-yellow-400 hover:!to-amber-500 hover:!shadow-[0_0_30px_rgba(245,158,11,0.35)]'
          }`}
        >
          {loading ? (
            <span className="!text-gray-400 !text-sm">{loadingStep}</span>
          ) : currentStoryTopic === 'HEALTH' ? (
            '🎬 Tạo Video Ngắn & Đăng Kênh'
          ) : (
            '🔊 Xuất Âm Thanh Đọc Truyện'
          )}
        </Button>
      </form>
    </section>
  );
};
