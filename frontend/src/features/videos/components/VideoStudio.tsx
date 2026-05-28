import React, { useState } from 'react';
import { Input, Select, Button, Tooltip, Tag } from 'antd';
import {
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  PictureOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Story } from '@/features/videos/types';
import { StudioConfigPanel } from '@/features/videos/components/StudioConfigPanel';

// ─── Scene Types ──────────────────────────────────────────────────────
export interface Scene {
  id: string;
  scriptText: string;        // Script content of this scene
  imageUrl?: string;         // Background image URL (optional)
}

function scenesToContent(scenes: Scene[]): string {
  return scenes.map(s => {
    if (s.imageUrl && s.imageUrl.trim()) {
      return `[image: ${s.imageUrl.trim()}]\n${s.scriptText.trim()}`;
    }
    return s.scriptText.trim();
  }).join('\n\n');
}

interface VideoStudioProps {
  stories: Story[];
  onSubmit: (payload: any) => Promise<void>;
  loading: boolean;
  loadingStep: string;
}

export const VideoStudio: React.FC<VideoStudioProps> = ({ stories, onSubmit, loading, loadingStep }) => {
  const [selectedStoryId, setSelectedStoryId] = useState<number>(3); // Fallback to Health story (3)
  const [title, setTitle] = useState('');
  
  // Selection mode: manual scenes list vs AI auto builder
  const [autoAiBuilder, setAutoAiBuilder] = useState(false);
  const [scenes, setScenes] = useState<Scene[]>(() => [{ id: crypto.randomUUID(), scriptText: '' }]);
  const [rawContent, setRawContent] = useState('');
  
  const [summary, setSummary] = useState('');
  const [sourceUrl, setSourceUrl] = useState('');

  // Custom Styling / Audio Settings State
  const [voiceSpeed, setVoiceSpeed] = useState<number>(1.0);
  const [musicVolume, setMusicVolume] = useState<number>(0.12);
  const [accentColor, setAccentColor] = useState<string>('emerald');
  const [fontFamily, setFontFamily] = useState<string>('sans');

  const currentStoryTopic = stories.find(s => s.id === Number(selectedStoryId))?.topic ?? 'TUTIEN';

  // ──────────────────────────────────────────────────────────
  // Scene Action Handlers
  // ──────────────────────────────────────────────────────────
  const updateSceneText = (id: string, text: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, scriptText: text } : s));
  };

  const updateSceneImage = (id: string, url: string) => {
    setScenes(prev => prev.map(s => s.id === id ? { ...s, imageUrl: url } : s));
  };

  const addSceneAfter = (index: number) => {
    const newScene: Scene = { id: crypto.randomUUID(), scriptText: '' };
    setScenes(prev => {
      const updated = [...prev];
      updated.splice(index + 1, 0, newScene);
      return updated;
    });
  };

  const removeScene = (id: string) => {
    if (scenes.length <= 1) {
      alert('Cần ít nhất một phân cảnh');
      return;
    }
    setScenes(prev => prev.filter(s => s.id !== id));
  };

  const moveScene = (index: number, dir: 'up' | 'down') => {
    setScenes(prev => {
      const updated = [...prev];
      const target = dir === 'up' ? index - 1 : index + 1;
      if (target < 0 || target >= updated.length) return prev;
      [updated[index], updated[target]] = [updated[target], updated[index]];
      return updated;
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    let contentStr = '';
    if (autoAiBuilder) {
      contentStr = rawContent.trim();
    } else {
      contentStr = scenesToContent(scenes);
    }

    if (!title.trim() || !contentStr.trim()) {
      alert('Vui lòng điền đầy đủ Tiêu đề và Nội dung kịch bản!');
      return;
    }

    const payload = {
      title,
      content: contentStr,
      summary: summary || 'Tóm tắt ngắn gọn...',
      sourceUrl: sourceUrl || `https://example.com/suc-khoe/generated-${Date.now()}`,
      storyId: Number(selectedStoryId),
      voiceSpeed,
      musicVolume,
      accentColor,
      fontFamily,
      autoAiBuilder // Send the toggle flag to backend
    };

    onSubmit(payload).then(() => {
      // Clear form on success
      setTitle('');
      setScenes([{ id: crypto.randomUUID(), scriptText: '' }]);
      setRawContent('');
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

        {/* Editing Mode Selector (HEALTH only) */}
        {currentStoryTopic === 'HEALTH' && (
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Phương thức soạn thảo</label>
            <Select
              value={autoAiBuilder ? 'ai' : 'manual'}
              onChange={(val) => setAutoAiBuilder(val === 'ai')}
              className="w-full !bg-transparent text-white [&>.ant-select-selector]:!bg-black/40 [&>.ant-select-selector]:!border-dark-border [&>.ant-select-selector]:!text-white [&>.ant-select-selector]:!rounded-xl [&>.ant-select-selector]:!h-12 [&>.ant-select-selector]:!py-1.5 focus:!border-emerald-500"
              popupClassName="!bg-[#0f1412] !border !border-white/10 [&_.ant-select-item]:!text-gray-300 [&_.ant-select-item-option-selected]:!bg-emerald-500/20 [&_.ant-select-item-option-active]:!bg-white/5 hover:[&_.ant-select-item]:!text-white"
            >
              <Select.Option value="manual">✍️ Tự biên soạn & phân cảnh thủ công</Select.Option>
              <Select.Option value="ai">🪄 AI tự động phân cảnh & gán ảnh minh họa</Select.Option>
            </Select>
          </div>
        )}

        {/* Conditional Content Input Section */}
        {!autoAiBuilder || currentStoryTopic !== 'HEALTH' ? (
          /* Manual Scenes list */
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="block text-gray-400 text-sm font-bold flex items-center gap-1.5">
                {currentStoryTopic === 'HEALTH' && <PictureOutlined />}
                {currentStoryTopic === 'HEALTH' ? 'Phân cảnh & Script Video' : 'Các đoạn Script kể chuyện'}
              </label>
              <Tag className="!bg-white/5 !border-white/10 !text-gray-400 !rounded-full !text-xs">
                {scenes.length} đoạn
              </Tag>
            </div>

            <AnimatePresence initial={false}>
              {scenes.map((scene, index) => (
                <motion.div
                  key={scene.id}
                  initial={{ opacity: 0, y: -8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="mb-4"
                >
                  {/* Scene card */}
                  <div className="bg-black/20 border border-dark-border rounded-2xl p-4 group hover:border-white/10 transition-all duration-200">
                    {/* Scene header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        Phân cảnh #{index + 1}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Tooltip title="Di chuyển lên">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => moveScene(index, 'up')}
                            className="!text-gray-500 hover:!text-white !rounded-lg"
                          />
                        </Tooltip>
                        <Tooltip title="Di chuyển xuống">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowDownOutlined />}
                            disabled={index === scenes.length - 1}
                            onClick={() => moveScene(index, 'down')}
                            className="!text-gray-500 hover:!text-white !rounded-lg"
                          />
                        </Tooltip>
                        <Tooltip title="Xóa phân cảnh">
                          <Button
                            type="text"
                            size="small"
                            danger
                            icon={<DeleteOutlined />}
                            onClick={() => removeScene(scene.id)}
                            className="!text-gray-600 hover:!text-red-400 !rounded-lg"
                          />
                        </Tooltip>
                      </div>
                    </div>

                    {/* Script text */}
                    <Input.TextArea
                      rows={3}
                      value={scene.scriptText}
                      onChange={e => updateSceneText(scene.id, e.target.value)}
                      placeholder="Nhập nội dung script của phân cảnh này..."
                      required
                      className="w-full !bg-black/30 !border-white/5 !text-white !px-4 !py-3 !rounded-xl focus:!outline-none focus:!border-emerald-500 transition duration-200 placeholder:!text-gray-700 !resize-none"
                    />

                    {/* Image URL for HEALTH videos */}
                    {currentStoryTopic === 'HEALTH' && (
                      <div className="mt-3">
                        <Input
                          prefix={<PictureOutlined className="!text-gray-600" />}
                          placeholder="URL ảnh nền phân cảnh (tuỳ chọn)"
                          value={scene.imageUrl || ''}
                          onChange={e => updateSceneImage(scene.id, e.target.value)}
                          allowClear
                          className="w-full !bg-black/30 !border-white/5 !text-white !px-4 !py-2 !rounded-xl focus:!outline-none focus:!border-emerald-500 transition duration-200 placeholder:!text-gray-700"
                        />
                        {scene.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/5 h-20">
                            <img
                              src={scene.imageUrl}
                              alt="preview"
                              className="w-full h-full object-cover"
                              onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                            />
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Add scene button below */}
                  <div className="flex justify-center mt-2">
                    <Button
                      type="dashed"
                      size="small"
                      icon={<PlusOutlined />}
                      onClick={() => addSceneAfter(index)}
                      className="!border-white/5 !text-gray-600 hover:!text-emerald-400 hover:!border-emerald-500/50 !rounded-xl !text-xs transition-all duration-200"
                    >
                      Thêm phân cảnh mới
                  </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          /* Single large Text Area for AI Auto split */
          <div>
            <label className="block text-gray-400 text-sm font-bold mb-2">Kịch bản thô (AI sẽ tự động chia phân cảnh & chọn ảnh)</label>
            <Input.TextArea
              rows={8}
              placeholder="Nhập toàn bộ nội dung kịch bản thô của bạn tại đây... AI (DeepSeek) sẽ tự động phân tích ý nghĩa, cắt nhỏ thành các phân cảnh tương ứng và gán ảnh minh họa đẹp mắt."
              value={rawContent}
              onChange={(e) => setRawContent(e.target.value)}
              required
              className="w-full !bg-black/40 !border-dark-border !text-white !px-4 !py-3 !rounded-xl focus:!outline-none focus:!border-emerald-500 transition duration-200 placeholder:!text-gray-600 !resize-none"
            />
          </div>
        )}

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
