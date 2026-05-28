import React, { useState } from 'react';
import { Card, Button, Tooltip } from 'antd';
import { DeleteOutlined, PlayCircleOutlined, SoundOutlined, SendOutlined, EditOutlined } from '@ant-design/icons';
import type { Chapter } from '@/features/videos/types';
import { EditChapterModal } from './EditChapterModal';

interface VideoCardProps {
  chapter: Chapter;
  onDelete: (id: number) => void;
  onPlay: (url: string, type: 'audio' | 'video', title: string) => void;
  getMediaUrl: (filename: string | null, type: 'audio' | 'video') => string | null;
  onRenderVideo?: (id: number) => Promise<void>;
  onSendAudio?: (id: number) => Promise<void>;
  onSendVideo?: (id: number) => Promise<void>;
}

export const VideoCard: React.FC<VideoCardProps> = ({
  chapter,
  onDelete,
  onPlay,
  getMediaUrl,
  onRenderVideo,
  onSendAudio,
  onSendVideo,
}) => {
  const [isRendering, setIsRendering] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isSendingVideo, setIsSendingVideo] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const hasVideo = !!chapter.videoPath;
  const hasAudio = !!chapter.audioPath;
  const topicLabel = chapter.story?.topic ?? 'TUTIEN';

  return (
    <Card
      className="!bg-dark-card !border-dark-border backdrop-blur-md !rounded-3xl hover:!border-white/20 transition-all duration-300 group flex flex-col justify-between [&>.ant-card-body]:!p-5 [&>.ant-card-body]:!flex [&>.ant-card-body]:!flex-col [&>.ant-card-body]:!justify-between [&>.ant-card-body]:!h-full [&>.ant-card-body]:!w-full"
      bordered={true}
    >
      <div>
        <div className="flex justify-between items-start mb-3">
          <span
            className={`text-xs font-black tracking-widest uppercase px-3 py-1.5 rounded-full ${
              topicLabel === 'HEALTH'
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-amber-500/10 text-amber-400'
            }`}
          >
            {topicLabel === 'HEALTH' ? '🎬 HEALTH - Video' : '📖 TUTIEN - Audio'}
          </span>
          <div className="flex items-center gap-1.5">
            <Tooltip title="Chỉnh sửa kịch bản">
              <Button
                type="text"
                icon={<EditOutlined className="!text-lg" />}
                onClick={() => setIsEditOpen(true)}
                className="!text-gray-500 hover:!text-emerald-400 !p-1.5 transition duration-150 !rounded-lg hover:!bg-white/5"
              />
            </Tooltip>
            <Tooltip title="Xóa bài viết">
              <Button
                type="text"
                danger
                icon={<DeleteOutlined className="!text-lg" />}
                onClick={() => onDelete(chapter.id)}
                className="!text-gray-500 hover:!text-red-400 !p-1.5 transition duration-150 !rounded-lg hover:!bg-white/5"
              />
            </Tooltip>
          </div>
        </div>

        <h3 className="text-xl font-bold text-white group-hover:text-emerald-400 transition duration-200 line-clamp-2">
          {chapter.title}
        </h3>
        
        <p className="text-gray-400 text-sm mt-3 line-clamp-3 leading-relaxed">
          {chapter.content}
        </p>
      </div>

      <div className="mt-6 border-t border-white/5 pt-4 flex flex-col gap-3">
        {/* Phát & Gửi Video (HEALTH) */}
        {topicLabel === 'HEALTH' && (
          <div className="flex gap-3">
            <Button
              type="primary"
              disabled={!hasVideo}
              icon={<PlayCircleOutlined />}
              onClick={() => {
                const url = getMediaUrl(chapter.videoPath, 'video');
                if (url) onPlay(url, 'video', chapter.title);
              }}
              className={`flex-1 !flex items-center justify-center gap-2 !py-2.5 font-extrabold !rounded-xl transition duration-200 !border-0 !h-auto ${
                hasVideo
                  ? '!bg-emerald-500 hover:!bg-emerald-400 !text-black shadow-lg hover:shadow-emerald-500/20'
                  : '!bg-white/5 !text-gray-500 cursor-not-allowed'
              }`}
            >
              Phát Video Dọc
            </Button>

            {hasVideo && (
              <Button
                type="primary"
                loading={isSendingVideo}
                icon={!isSendingVideo && <SendOutlined />}
                onClick={async () => {
                  if (onSendVideo) {
                    setIsSendingVideo(true);
                    try {
                      await onSendVideo(chapter.id);
                    } finally {
                      setIsSendingVideo(false);
                    }
                  }
                }}
                className="flex-1 !flex items-center justify-center gap-2 !py-2.5 !bg-gradient-to-r !from-sky-500 !to-sky-400 hover:!from-sky-400 hover:!to-sky-500 !text-black font-extrabold !rounded-xl transition duration-200 shadow-lg hover:shadow-sky-500/20 !border-0 disabled:opacity-50 disabled:cursor-not-allowed !h-auto"
              >
                {isSendingVideo ? 'Đang gửi...' : 'Gửi Tele'}
              </Button>
            )}
          </div>
        )}

        {/* Tạo / Re-render Video (HEALTH) */}
        {topicLabel === 'HEALTH' && (
          <Button
            type="primary"
            loading={isRendering}
            icon={!isRendering && <PlayCircleOutlined />}
            onClick={async () => {
              if (onRenderVideo) {
                setIsRendering(true);
                try {
                  await onRenderVideo(chapter.id);
                } finally {
                  setIsRendering(false);
                }
              }
            }}
            className="w-full !flex items-center justify-center gap-2 !py-2.5 !bg-gradient-to-r !from-amber-500 !to-yellow-400 hover:!from-yellow-400 hover:!to-amber-500 !text-black font-extrabold !rounded-xl transition duration-200 shadow-lg hover:shadow-amber-500/20 !border-0 disabled:opacity-50 disabled:cursor-not-allowed !h-auto"
          >
            {isRendering ? 'Đang tạo Video...' : (hasVideo ? 'Re-render Video' : 'Tạo Video')}
          </Button>
        )}

        {/* Nghe Giọng Đọc (Chỉ hiển thị với các chủ đề không phải HEALTH) */}
        {hasAudio && topicLabel !== 'HEALTH' && (
          <Button
            type="default"
            icon={<SoundOutlined />}
            onClick={() => {
              const url = getMediaUrl(chapter.audioPath, 'audio');
              if (url) onPlay(url, 'audio', chapter.title);
            }}
            className="w-full !flex items-center justify-center gap-2 !py-2.5 !bg-white/5 hover:!bg-white/10 !text-white font-bold !rounded-xl transition duration-200 !border-white/10 !h-auto"
          >
            Nghe Giọng Đọc
          </Button>
        )}

        {/* Gửi Audio lên Telegram (TUTIEN) */}
        {topicLabel !== 'HEALTH' && (
          <Button
            type="default"
            loading={isSending}
            icon={!isSending && <SendOutlined />}
            onClick={async () => {
              if (onSendAudio) {
                setIsSending(true);
                try {
                  await onSendAudio(chapter.id);
                } finally {
                  setIsSending(false);
                }
              }
            }}
            className="w-full !flex items-center justify-center gap-2 !py-2.5 !bg-gradient-to-r !from-sky-600/30 !to-sky-500/20 hover:!from-sky-500/40 hover:!to-sky-400/30 !text-sky-300 font-bold !rounded-xl transition duration-200 !border-sky-500/30 hover:!border-sky-400/50 disabled:opacity-50 disabled:cursor-not-allowed !h-auto"
          >
            {isSending ? 'Đang gửi Telegram...' : 'Gửi Audio Lên Tele'}
          </Button>
        )}

        {!hasVideo && !hasAudio && topicLabel === 'HEALTH' && (
          <span className="text-center text-xs text-gray-600 py-2">
            Không có file đa phương tiện
          </span>
        )}
      </div>

      <EditChapterModal
        chapter={chapter}
        open={isEditOpen}
        onClose={() => setIsEditOpen(false)}
        onUpdated={() => window.location.reload()}
      />
    </Card>
  );
};
