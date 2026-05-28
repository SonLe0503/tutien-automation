import React, { useState, useEffect } from 'react';
import { Modal, Input, Button, Tabs, Divider, Tooltip, message, Tag } from 'antd';
import {
  EditOutlined,
  VideoCameraOutlined,
  SoundOutlined,
  PictureOutlined,
  PlusOutlined,
  DeleteOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  SaveOutlined,
  ThunderboltOutlined,
} from '@ant-design/icons';
import { motion, AnimatePresence } from 'framer-motion';
import type { Chapter } from '@/features/videos/types';
import { updateChapter, renderChapterVideo } from '@/features/videos/api';
import { StudioConfigPanel } from '@/features/videos/components/StudioConfigPanel';

// ─── Scene Types ──────────────────────────────────────────────────────
export interface Scene {
  id: string;
  scriptText: string;        // Đoạn script cho phân cảnh này
  imageUrl?: string;         // URL ảnh nền cho phân cảnh (tuỳ chọn)
}

// ─── Props ────────────────────────────────────────────────────────────
interface EditChapterModalProps {
  chapter: Chapter;
  open: boolean;
  onClose: () => void;
  onUpdated: () => void; // Callback để reload data sau khi lưu/render
}

// ─── Helper: Split content into scenes by paragraph ──────────────────
function parseScenes(content: string): Scene[] {
  const paragraphs = content.split(/\n\n+/).map(s => s.trim()).filter(Boolean);
  if (paragraphs.length === 0) {
    return [{ id: crypto.randomUUID(), scriptText: content }];
  }
  return paragraphs.map(text => {
    const match = text.match(/^\[image:\s*([^\]]+)\]\s*\n?([\s\S]*)$/);
    if (match) {
      return {
        id: crypto.randomUUID(),
        imageUrl: match[1].trim(),
        scriptText: match[2].trim(),
      };
    }
    return {
      id: crypto.randomUUID(),
      scriptText: text,
    };
  });
}

function scenesToContent(scenes: Scene[]): string {
  return scenes.map(s => {
    if (s.imageUrl && s.imageUrl.trim()) {
      return `[image: ${s.imageUrl.trim()}]\n${s.scriptText.trim()}`;
    }
    return s.scriptText.trim();
  }).join('\n\n');
}

// ─── Component ───────────────────────────────────────────────────────
export const EditChapterModal: React.FC<EditChapterModalProps> = ({
  chapter,
  open,
  onClose,
  onUpdated,
}) => {
  const isHealth = chapter.story?.topic === 'HEALTH';
  const hasAudio = !!chapter.audioPath;

  // ── Form state ──────────────────────────────────────────
  const [title, setTitle] = useState(chapter.title);
  const [scenes, setScenes] = useState<Scene[]>(parseScenes(chapter.content));
  const [activeTab, setActiveTab] = useState('edit');

  // ── Render settings ─────────────────────────────────────
  const [voiceSpeed, setVoiceSpeed] = useState(1.0);
  const [musicVolume, setMusicVolume] = useState(0.12);
  const [accentColor, setAccentColor] = useState('emerald');
  const [fontFamily, setFontFamily] = useState('sans');

  // ── Status ──────────────────────────────────────────────
  const [isSaving, setIsSaving] = useState(false);
  const [isRendering, setIsRendering] = useState(false);
  const [loadingMsg, setLoadingMsg] = useState('');

  // Re-init khi chapter thay đổi
  useEffect(() => {
    setTitle(chapter.title);
    setScenes(parseScenes(chapter.content));
    setActiveTab('edit');
    setLoadingMsg('');
  }, [chapter.id, open]);

  // ──────────────────────────────────────────────────────────
  // Scene handlers
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
    setScenes(prev => {
      if (prev.length <= 1) {
        message.warning('Cần ít nhất một phân cảnh');
        return prev;
      }
      return prev.filter(s => s.id !== id);
    });
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

  // ──────────────────────────────────────────────────────────
  // Save only (PATCH content + title)
  // ──────────────────────────────────────────────────────────
  const handleSave = async () => {
    const content = scenesToContent(scenes);
    if (!title.trim() || !content.trim()) {
      message.error('Tiêu đề và nội dung không được để trống!');
      return;
    }

    setIsSaving(true);
    try {
      await updateChapter(chapter.id, { title, content });
      message.success('Đã lưu thay đổi thành công!');
      onUpdated();
    } catch (err: any) {
      message.error('Lưu thất bại: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  // ──────────────────────────────────────────────────────────
  // Save + Render video
  // ──────────────────────────────────────────────────────────
  const handleSaveAndRender = async () => {
    const content = scenesToContent(scenes);
    if (!title.trim() || !content.trim()) {
      message.error('Tiêu đề và nội dung không được để trống!');
      return;
    }

    setIsRendering(true);
    try {
      // 1. Lưu thay đổi trước
      setLoadingMsg('Đang lưu thay đổi...');
      await updateChapter(chapter.id, { title, content });

      // 2. Render video
      setLoadingMsg('Đang tổng hợp giọng nói AI (GenMax)...');
      await new Promise(r => setTimeout(r, 500));
      setLoadingMsg('Đang render video HyperFrames (20-30s)...');

      await renderChapterVideo(chapter.id, { voiceSpeed, musicVolume, accentColor, fontFamily });

      setLoadingMsg('🎉 Hoàn tất! Đã gửi lên Telegram!');
      await new Promise(r => setTimeout(r, 2000));

      message.success('Đã lưu & render video thành công!');
      onUpdated();
      onClose();
    } catch (err: any) {
      message.error('Render thất bại: ' + err.message);
    } finally {
      setIsRendering(false);
      setLoadingMsg('');
    }
  };

  // ──────────────────────────────────────────────────────────
  // Tab items
  // ──────────────────────────────────────────────────────────
  const tabItems = [
    {
      key: 'edit',
      label: (
        <span className="flex items-center gap-1.5">
          <EditOutlined /> Chỉnh sửa Script
        </span>
      ),
      children: (
        <div className="space-y-5 pt-2">
          {/* Title */}
          <div>
            <label className="block text-gray-400 text-xs font-bold mb-1.5 uppercase tracking-wider">
              Tiêu đề
            </label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              className="!bg-black/40 !border-white/10 !text-white !rounded-xl !h-11 focus:!border-emerald-500 placeholder:!text-gray-600"
              placeholder="Tiêu đề bài viết..."
            />
          </div>

          <Divider className="!border-white/10 !my-4" />

          {/* Scenes */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-gray-400 text-xs font-bold uppercase tracking-wider flex items-center gap-1.5">
                {isHealth && <PictureOutlined />}
                {isHealth ? 'Phân cảnh & Script' : 'Nội dung Script'}
              </label>
              <Tag
                className="!bg-white/5 !border-white/10 !text-gray-400 !rounded-full !text-xs"
              >
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
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 group hover:border-white/20 transition-all duration-200">
                    {/* Scene header */}
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-black text-gray-500 uppercase tracking-widest">
                        #{index + 1}
                      </span>
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                        <Tooltip title="Di lên">
                          <Button
                            type="text"
                            size="small"
                            icon={<ArrowUpOutlined />}
                            disabled={index === 0}
                            onClick={() => moveScene(index, 'up')}
                            className="!text-gray-500 hover:!text-white !rounded-lg"
                          />
                        </Tooltip>
                        <Tooltip title="Di xuống">
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
                      placeholder="Nhập nội dung đoạn script..."
                      className="!bg-black/30 !border-white/10 !text-white !rounded-xl focus:!border-emerald-500 placeholder:!text-gray-700 !resize-none"
                    />

                    {/* Image URL for HEALTH videos */}
                    {isHealth && (
                      <div className="mt-3">
                        <Input
                          prefix={<PictureOutlined className="!text-gray-600" />}
                          placeholder="URL ảnh nền phân cảnh (tuỳ chọn)"
                          value={scene.imageUrl || ''}
                          onChange={e => updateSceneImage(scene.id, e.target.value)}
                          allowClear
                          className="!bg-black/30 !border-white/10 !text-white !rounded-xl !h-9 focus:!border-purple-500 placeholder:!text-gray-700"
                        />
                        {scene.imageUrl && (
                          <div className="mt-2 rounded-xl overflow-hidden border border-white/10 h-20">
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
                      className="!border-white/10 !text-gray-600 hover:!text-emerald-400 hover:!border-emerald-500/50 !rounded-xl !text-xs transition-all duration-200"
                    >
                      Thêm phân cảnh
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>
      ),
    },
    {
      key: 'render',
      label: (
        <span className="flex items-center gap-1.5">
          {isHealth ? <VideoCameraOutlined /> : <SoundOutlined />}
          Cài đặt Render
        </span>
      ),
      children: (
        <div className="pt-2">
          <StudioConfigPanel
            currentStoryTopic={isHealth ? 'HEALTH' : 'TUTIEN'}
            voiceSpeed={voiceSpeed}
            setVoiceSpeed={setVoiceSpeed}
            musicVolume={musicVolume}
            setMusicVolume={setMusicVolume}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            fontFamily={fontFamily}
            setFontFamily={setFontFamily}
          />
        </div>
      ),
    },
  ];

  // ──────────────────────────────────────────────────────────
  // Footer buttons
  // ──────────────────────────────────────────────────────────
  const footer = isRendering ? (
    <div className="flex items-center justify-center gap-3 py-3">
      <div className="w-4 h-4 border-2 border-t-transparent border-emerald-400 rounded-full animate-spin" />
      <span className="text-gray-400 text-sm animate-pulse">{loadingMsg}</span>
    </div>
  ) : (
    <div className="flex gap-3 pt-1">
      <Button
        type="default"
        onClick={onClose}
        className="!border-white/10 !text-gray-400 hover:!text-white hover:!border-white/30 !rounded-xl !h-10"
      >
        Huỷ
      </Button>
      <Button
        icon={<SaveOutlined />}
        loading={isSaving}
        onClick={handleSave}
        className="!border-white/10 !text-gray-300 hover:!text-white hover:!border-white/30 !bg-white/5 hover:!bg-white/10 !rounded-xl !h-10 flex-1"
      >
        Chỉ lưu
      </Button>
      <Button
        type="primary"
        icon={<ThunderboltOutlined />}
        onClick={handleSaveAndRender}
        className={`flex-1 !rounded-xl !h-10 !border-0 font-bold !text-black ${
          isHealth
            ? '!bg-gradient-to-r !from-emerald-500 !to-emerald-400 hover:!from-emerald-400 hover:!to-emerald-500 shadow-lg shadow-emerald-500/20'
            : '!bg-gradient-to-r !from-amber-500 !to-yellow-400 hover:!from-yellow-400 hover:!to-amber-500 shadow-lg shadow-amber-500/20'
        }`}
      >
        {isHealth
          ? (chapter.videoPath ? '🎬 Lưu & Re-render Video' : '🎬 Lưu & Tạo Video')
          : (hasAudio ? '🔊 Lưu & Xuất Video' : '🔊 Lưu & Tổng hợp Audio')}
      </Button>
    </div>
  );

  return (
    <Modal
      open={open}
      onCancel={onClose}
      footer={footer}
      centered
      width={680}
      title={
        <div className="flex items-center gap-3 pr-8">
          <div className={`w-8 h-8 rounded-xl flex items-center justify-center text-base ${
            isHealth ? 'bg-emerald-500/20' : 'bg-amber-500/20'
          }`}>
            {isHealth ? '🎬' : '📖'}
          </div>
          <div>
            <div className="text-white font-bold text-base leading-tight line-clamp-1">
              {chapter.title}
            </div>
            <div className="text-xs text-gray-500 mt-0.5">
              {isHealth ? 'HEALTH — Video 9:16' : 'TUTIEN — Audio MP3'}
              {' · '}ID #{chapter.id}
            </div>
          </div>
        </div>
      }
      className="[&>.ant-modal-content]:!bg-[#0d1210] [&>.ant-modal-content]:!border [&>.ant-modal-content]:!border-white/10 [&>.ant-modal-content]:!rounded-3xl [&>.ant-modal-header]:!bg-transparent [&>.ant-modal-header]:!border-b [&>.ant-modal-header]:!border-white/10 [&>.ant-modal-header]:!pb-4 [&>.ant-modal-footer]:!border-t [&>.ant-modal-footer]:!border-white/10 [&>.ant-modal-footer]:!pt-4 [&>.ant-modal-close]:!text-gray-500 hover:[&>.ant-modal-close]:!text-white [&>.ant-modal-close]:hover:!bg-white/10 [&>.ant-modal-close]:!rounded-xl [&>.ant-modal-body]:!max-h-[65vh] [&>.ant-modal-body]:!overflow-y-auto"
    >
      <Tabs
        activeKey={activeTab}
        onChange={setActiveTab}
        items={tabItems}
        className="[&>.ant-tabs-nav]:!mb-4 [&_.ant-tabs-tab]:!text-gray-500 [&_.ant-tabs-tab-active_.ant-tabs-tab-btn]:!text-emerald-400 [&_.ant-tabs-ink-bar]:!bg-emerald-400"
      />
    </Modal>
  );
};
